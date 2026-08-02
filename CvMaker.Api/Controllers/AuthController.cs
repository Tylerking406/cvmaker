using CvMaker.Api.Auth;
using CvMaker.Api.Data;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting(RateLimitPolicies.Auth)]
public class AuthController(
    AppDbContext db,
    TokenService tokens,
    IWebHostEnvironment env,
    ILogger<AuthController> logger) : ControllerBase
{
    private string ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    /// <summary>
    /// A valid BCrypt hash used only to burn the same CPU time when an email is unknown,
    /// so response timing does not reveal whether an account exists.
    /// </summary>
    private const string DummyHash = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    private const string InvalidCredentials = "Incorrect email or password.";

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var email = (request.Email ?? "").Trim().ToLowerInvariant();
        var name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim();

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return BadRequest(new { error = "A valid email address is required." });
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        if (await db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { error = "An account with this email already exists." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 11),
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(user);

        // Start every new account with a CV so the dashboard is never a dead end.
        db.Cvs.Add(new Cv
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = name is null ? "My CV" : $"{name}'s CV",
            Template = "ats-classic",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when ((ex.InnerException as PostgresException)?.SqlState == "23505")
        {
            // The AnyAsync check above is read-then-write, so two concurrent registrations
            // for the same email both pass it. The unique index catches the loser; without
            // this it would surface as a bare 500.
            logger.LogInformation("Registration lost the unique-index race for {Email}", email);
            return Conflict(new { error = "An account with this email already exists." });
        }

        logger.LogInformation("Registered user {UserId} from {ClientIp}", user.Id, ClientIp);
        return StatusCode(StatusCodes.Status201Created, IssueToken(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = (request.Email ?? "").Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Always run a verify — including against the dummy hash for unknown emails — so
        // that "no such account" and "wrong password" take the same time and return the
        // same message.
        var hash = user?.PasswordHash ?? DummyHash;
        var ok = BCrypt.Net.BCrypt.Verify(request.Password ?? "", hash);

        if (user is null || user.PasswordHash is null || !ok)
        {
            logger.LogWarning("Failed login for {Email} from {ClientIp}", email, ClientIp);
            return Unauthorized(new { error = InvalidCredentials });
        }

        logger.LogInformation("Login for user {UserId} from {ClientIp}", user.Id, ClientIp);
        return Ok(IssueToken(user));
    }

    /// <summary>
    /// Rehydration endpoint. Authenticated by the cookie after a page refresh; echoes the
    /// caller's own token back so the client can restore its in-memory copy for the
    /// Authorization header. Deliberately does not mint a fresh token — no rotation semantics.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null) return Unauthorized(new { error = "Account no longer exists." });

        var token = await HttpContext.GetTokenAsync(JwtBearerDefaults.AuthenticationScheme, "access_token")
                    ?? Request.Cookies[AuthCookieExtensions.CookieName]
                    ?? "";

        return Ok(new AuthResponse(token, "Bearer", tokens.ExpirySeconds,
            new AuthUser(user.Id, user.Email, user.Name)));
    }

    /// <remarks>
    /// Always returns 200, whether or not the address is registered. Reporting "no such
    /// account" here would turn this endpoint into an account-enumeration oracle, which is
    /// the same reason Login uses one message for every failure.
    /// </remarks>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request, PasswordResetService resets, IEmailSender email, IConfiguration config)
    {
        var address = (request.Email ?? "").Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == address);

        if (user is not null)
        {
            var token = await resets.IssueAsync(user);
            var baseUrl = config["App:PublicUrl"] ?? "http://localhost:3000";
            await email.SendPasswordResetAsync(user.Email, $"{baseUrl}/reset-password?token={token}");
            logger.LogInformation("Password reset requested for user {UserId} from {ClientIp}", user.Id, ClientIp);
        }
        else
        {
            logger.LogInformation("Password reset requested for unknown address from {ClientIp}", ClientIp);
        }

        return Ok(new { message = "If that email is registered, a reset link is on its way." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, PasswordResetService resets)
    {
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        var token = await resets.FindRedeemableAsync(request.Token ?? "");
        if (token is null)
        {
            logger.LogWarning("Invalid or expired password reset token used from {ClientIp}", ClientIp);
            return BadRequest(new { error = "This reset link is invalid or has expired." });
        }

        token.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 11);
        token.UsedAt = DateTime.UtcNow;   // single use
        await db.SaveChangesAsync();

        logger.LogInformation("Password reset completed for user {UserId} from {ClientIp}", token.UserId, ClientIp);

        // Note: tokens carry no jti and there is no session store, so existing sessions for
        // this account stay valid until they expire (<= Supabase:ExpiryMinutes).
        return Ok(new { message = "Password updated. You can now sign in." });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public IActionResult Logout()
    {
        Response.ClearAuthCookie(env.IsDevelopment());
        return NoContent();
    }

    private AuthResponse IssueToken(User user)
    {
        var token = tokens.CreateToken(user, out var expiresAt);
        Response.SetAuthCookie(token, expiresAt, env.IsDevelopment());
        return new AuthResponse(token, "Bearer", tokens.ExpirySeconds,
            new AuthUser(user.Id, user.Email, user.Name));
    }
}
