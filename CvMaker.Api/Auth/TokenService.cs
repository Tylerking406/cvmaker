using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CvMaker.Api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CvMaker.Api.Auth;

public class TokenService(IOptions<JwtOptions> options)
{
    private readonly JwtOptions _opts = options.Value;

    public int ExpirySeconds => _opts.ExpiryMinutes * 60;

    /// <summary>
    /// Mints a token in Supabase's claim shape: sub, email, role=authenticated,
    /// aud=authenticated, iss, iat, nbf, exp.
    /// </summary>
    /// <remarks>
    /// Built via JwtSecurityToken directly rather than SecurityTokenDescriptor: the
    /// outbound claim type map would otherwise rewrite "sub" to "nameid", which breaks
    /// parity with real Supabase tokens (and with the RLS policies keyed on auth.uid()).
    /// </remarks>
    public string CreateToken(User user, out DateTimeOffset expiresAt)
    {
        var now = DateTimeOffset.UtcNow;
        expiresAt = now.AddMinutes(_opts.ExpiryMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("role", "authenticated"),
            new Claim(JwtRegisteredClaimNames.Iat, now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.JwtSecret)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
