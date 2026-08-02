using System.IdentityModel.Tokens.Jwt;
using System.Text;
using CvMaker.Api.Auth;
using CvMaker.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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

// Fail fast: an API that boots with an empty HMAC key silently accepts forged tokens,
// which is precisely the bug this replaces.
var jwtSecret = builder.Configuration["Supabase:JwtSecret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException(
        "Supabase__JwtSecret must be set and at least 32 bytes long (HS256 signing key).");

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

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Must stay anonymous: the docker-compose healthcheck polls it, and the frontend's
// depends_on: service_healthy would never be satisfied if the fallback policy applied.
app.MapGet("/health", () => Results.Ok(new { status = "healthy" })).AllowAnonymous();

app.Run();
