using System.Security.Cryptography;
using System.Text;
using CvMaker.Api.Data;
using CvMaker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Auth;

public class PasswordResetService(AppDbContext db)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(1);

    /// <summary>
    /// Creates a reset token and returns the raw value — the only time it exists in
    /// plaintext. Any outstanding tokens for the user are consumed first, so requesting a
    /// new link invalidates the previous one.
    /// </summary>
    public async Task<string> IssueAsync(User user)
    {
        var outstanding = await db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ToListAsync();
        foreach (var old in outstanding) old.UsedAt = DateTime.UtcNow;

        var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = Hash(raw),
            ExpiresAt = DateTime.UtcNow.Add(Lifetime),
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
        return raw;
    }

    /// <summary>Returns the token if it is valid and unspent, otherwise null.</summary>
    public Task<PasswordResetToken?> FindRedeemableAsync(string rawToken)
    {
        var hash = Hash(rawToken);
        return db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash
                                   && t.UsedAt == null
                                   && t.ExpiresAt > DateTime.UtcNow);
    }

    /// <remarks>
    /// Plain SHA-256 rather than BCrypt: the token is 32 bytes of CSPRNG output, so it has
    /// no guessable structure for an offline attack to exploit, and lookup is by hash.
    /// </remarks>
    private static string Hash(string raw) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
}
