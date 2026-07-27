namespace CvMaker.Api.Auth;

/// <summary>
/// Bound from the "Supabase" configuration section. The names mirror Supabase's own
/// terminology so that pointing this app at a real Supabase project is a config change:
/// swap JwtSecret for the project's JWT secret and Issuer for https://&lt;ref&gt;.supabase.co/auth/v1.
/// </summary>
public class JwtOptions
{
    public const string SectionName = "Supabase";

    /// <summary>HS256 shared secret. Supplied via environment only — never appsettings.</summary>
    public string JwtSecret { get; set; } = "";

    public string Issuer { get; set; } = "http://localhost:5133/auth/v1";
    public string Audience { get; set; } = "authenticated";
    public int ExpiryMinutes { get; set; } = 60;
}
