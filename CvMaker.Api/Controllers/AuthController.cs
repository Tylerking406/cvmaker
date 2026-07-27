using CvMaker.Api.Auth;
using CvMaker.Api.Data;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokens, IWebHostEnvironment env) : ControllerBase
{
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

        await db.SaveChangesAsync();

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
            return Unauthorized(new { error = InvalidCredentials });

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
