using CvMaker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Data;

public static class DbInitializer
{
    /// <summary>Fixed so CV ownership survives a schema reset.</summary>
    private static readonly Guid SeedUserId = new("11111111-1111-1111-1111-111111111111");

    private const string SeedEmail = "arinao.dev@gmail.com";

    /// <summary>
    /// Development-only. Brings an already-provisioned database up to date and seeds the
    /// documented dev account.
    /// </summary>
    /// <remarks>
    /// The ALTERs exist because Postgres only runs /docker-entrypoint-initdb.d/* on the
    /// first init of an empty volume — an existing postgres_data volume would otherwise
    /// never gain password_hash, and every login would fail on an unknown column.
    /// Both statements are idempotent, so this is safe on a fresh volume too.
    /// </remarks>
    public static async Task SeedAsync(AppDbContext db, string seedPassword)
    {
        await db.Database.ExecuteSqlRawAsync("alter table users add column if not exists password_hash text;");
        await db.Database.ExecuteSqlRawAsync("alter table users add column if not exists name text;");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == SeedEmail);
        if (user is null)
        {
            user = new User { Id = SeedUserId, Email = SeedEmail, CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
        }

        user.Name ??= "Arinao Ndou";
        // Re-hash every start so the documented password is always valid, even if the row
        // predates the password_hash column.
        user.PasswordHash ??= BCrypt.Net.BCrypt.HashPassword(seedPassword, 11);

        await db.SaveChangesAsync();
    }
}
