namespace CvMaker.Api.Models;

public class PasswordResetToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    /// <summary>
    /// SHA-256 of the token that was emailed. Only the hash is stored, for the same reason
    /// passwords are hashed: a database leak must not yield usable reset links.
    /// </summary>
    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    /// <summary>Set the first time the token is redeemed. Non-null means spent.</summary>
    public DateTime? UsedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
