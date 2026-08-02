namespace CvMaker.Api.Auth;

/// <summary>
/// Values that are committed to the repository for local convenience and are therefore
/// public. Program.cs refuses to start if any of these are in use outside Development.
/// </summary>
public static class DevelopmentDefaults
{
    /// <summary>Mirrors the fallback in docker-compose.yml.</summary>
    public const string JwtSecret = "local-dev-only-secret-change-me-32chars-min";
}
