using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CvMaker.Api.Data;

/// <summary>
/// Used only by the `dotnet ef` CLI. Without it, the tooling builds the real application
/// host, which trips the Supabase__JwtSecret fail-fast guard in Program.cs and reports the
/// misleading "Unable to create a DbContext" — even though nothing about generating a
/// migration needs a signing key.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=127.0.0.1;Port=5432;Database=cvmaker;Username=cvmaker;Password=cvmaker_local";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connection)
            .UseSnakeCaseNamingConvention()
            .Options;

        return new AppDbContext(options);
    }
}
