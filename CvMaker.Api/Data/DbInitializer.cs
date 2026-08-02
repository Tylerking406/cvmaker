using CvMaker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Data;

public static class DbInitializer
{
    /// <summary>Fixed so CV ownership survives a schema reset.</summary>
    private static readonly Guid SeedUserId = new("11111111-1111-1111-1111-111111111111");

    private const string SeedEmail = "arinao.dev@gmail.com";

    /// <summary>
    /// Development-only fixture data — the documented dev account. Schema is owned by EF
    /// migrations; this only inserts rows.
    /// </summary>
    /// <remarks>
    /// Credentials are reset on every start deliberately: this is disposable fixture data
    /// and the password in DEVELOPMENT.md must always work. Never enable outside
    /// Development — see the Seed:Enabled guard in Program.cs.
    /// </remarks>
    public static async Task SeedAsync(AppDbContext db, string seedPassword)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == SeedEmail);
        if (user is null)
        {
            user = new User { Id = SeedUserId, Email = SeedEmail, CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
        }

        user.Name = "Arinao Ndou";
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(seedPassword, 11);

        await db.SaveChangesAsync();
    }
}
