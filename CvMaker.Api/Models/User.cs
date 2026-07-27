namespace CvMaker.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;

    /// <summary>
    /// BCrypt hash. Null for rows mirrored from Supabase Auth, where credentials
    /// live in auth.users. Never serialise this — auth endpoints return projections.
    /// </summary>
    public string? PasswordHash { get; set; }

    public string? Name { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<Cv> Cvs { get; set; } = [];
}
