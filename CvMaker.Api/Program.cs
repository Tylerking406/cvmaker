using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Threading.RateLimiting;
using CvMaker.Api.Auth;
using CvMaker.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Trust the proxy's forwarded headers. Without this, behind a TLS-terminating proxy every
// request appears to come from the load balancer, which would collapse the per-IP rate
// limiter below into a single shared bucket and make it useless. It also keeps
// Request.Scheme correct for any future HTTPS redirect.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Hosts are unknown at build time (Railway, Fly, a k8s ingress, …). Restrict these in
    // a real deployment once the proxy's address is known.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// CORS — allow the Next.js frontend origin (override via CORS_ORIGIN env var).
// Deliberately no AllowCredentials: the browser reaches the API same-origin through the
// Next.js rewrite proxy, so the auth cookie never needs a cross-origin round trip.
var corsOrigin = builder.Configuration["CORS_ORIGIN"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

// ─── Auth ─────────────────────────────────────────────────────────────────────
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<CvOwnershipFilter>();
builder.Services.AddScoped<PasswordResetService>();

// Fail fast: an API that boots with a weak or publicly-known HMAC key silently accepts
// forged tokens for any user id. Checked before the other startup guards because it is the
// most severe — a misconfiguration here means anyone can impersonate anyone.
var jwtSecret = builder.Configuration["Supabase:JwtSecret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException(
        "Supabase__JwtSecret must be set and at least 32 bytes long (HS256 signing key).");

// The docker-compose fallback is committed to this repo, so it is public. It is long
// enough to clear the length check above, which is exactly why length alone is not a
// sufficient guard. Convenient in Development; fatal anywhere else.
if (jwtSecret == DevelopmentDefaults.JwtSecret && !builder.Environment.IsDevelopment())
    throw new InvalidOperationException(
        $"Supabase__JwtSecret is still the public repo default and the environment is " +
        $"'{builder.Environment.EnvironmentName}'. Anyone reading the repository could forge " +
        "tokens. Generate one with: openssl rand -base64 48");

// Password reset delivery. SMTP when configured; otherwise the logging sender, which only
// writes the link to the console. Outside Development that would lock users out of their
// accounts with no visible failure, so refuse to start rather than pretend to send mail.
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.SectionName));
var smtpHost = builder.Configuration[$"{SmtpOptions.SectionName}:Host"];

if (!string.IsNullOrWhiteSpace(smtpHost))
    builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
else if (builder.Environment.IsDevelopment())
    builder.Services.AddScoped<IEmailSender, LoggingEmailSender>();
else
    throw new InvalidOperationException(
        $"Email__Smtp__Host is not configured and the environment is " +
        $"'{builder.Environment.EnvironmentName}'. Password reset emails would be silently " +
        "dropped, locking users out. Configure SMTP before deploying.");

var jwtIssuer = builder.Configuration["Supabase:Issuer"] ?? "http://localhost:5133/auth/v1";
var jwtAudience = builder.Configuration["Supabase:Audience"] ?? "authenticated";

// Keep "sub" as "sub" instead of letting it be rewritten to ClaimTypes.NameIdentifier.
// Both this and MapInboundClaims=false are required; with either left on, every lookup
// of the "sub" claim silently returns null.
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.SaveToken = true;   // lets /api/auth/me echo the caller's own token back
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromSeconds(30),   // the 5-minute default makes expiry look broken
            NameClaimType = "sub",
            RoleClaimType = "role",
        };
        options.Events = new JwtBearerEvents
        {
            // Browsers authenticate with the httpOnly cookie (it survives refresh and is
            // readable by Next.js middleware); everything else uses the Bearer header.
            OnMessageReceived = ctx =>
            {
                if (string.IsNullOrEmpty(ctx.Token) &&
                    ctx.Request.Cookies.TryGetValue(AuthCookieExtensions.CookieName, out var cookie))
                    ctx.Token = cookie;
                return Task.CompletedTask;
            }
        };
    });

// Rate limiting. /api/auth/* is public and every login attempt costs a bcrypt verify at
// cost 11 (~100ms CPU), so an unlimited endpoint is both brute-forceable and a cheap
// amplification vector against ourselves. Partitioned by client IP — see the forwarded
// headers config above, without which every caller shares one bucket.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();

        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            """{"error":"Too many attempts. Please wait and try again."}""", token);
    };

    options.AddPolicy(RateLimitPolicies.Auth, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
});

// Secure by default: a new controller is protected unless it explicitly opts out.
builder.Services.AddAuthorization(options =>
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
// Note: no bearer security definition wired into Swagger — the Microsoft.OpenApi major
// version behind Swashbuckle 10.x changes that API shape. Authenticate manually with
// curl (see DEVELOPMENT.md) or paste a token via the browser's request headers.
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Migrations are the only source of truth for the schema, in every environment.
    // Single-instance assumption: concurrent replicas can deadlock on the history table,
    // so a multi-replica deployment should switch to `dotnet ef migrations bundle` run as
    // a deploy step instead.
    await db.Database.MigrateAsync();

    // Seed after migrating — it writes to users. Two locks, not one: a stray
    // ASPNETCORE_ENVIRONMENT=Development must not be enough on its own to plant a
    // known-credentials account, and the Dockerfile/compose pair already disagree about
    // which environment the container runs in.
    if (app.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("Seed:Enabled"))
        await DbInitializer.SeedAsync(db, builder.Configuration["Seed:Password"] ?? "Test1234");
}

if (app.Environment.IsDevelopment())
{
    // Swagger is middleware, not a routed endpoint, so the FallbackPolicy never covered
    // it — an environment check is the only thing keeping the API surface private.
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Must stay anonymous: the docker-compose healthcheck polls it, and the frontend's
// depends_on: service_healthy would never be satisfied if the fallback policy applied.
app.MapGet("/health", () => Results.Ok(new { status = "healthy" })).AllowAnonymous();

app.Run();
