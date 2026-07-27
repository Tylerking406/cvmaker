namespace CvMaker.Api.Auth;

/// <summary>
/// The auth cookie exists so the session survives a page refresh and so Next.js
/// middleware (which cannot read localStorage) can guard /dashboard and /cv.
/// The Authorization: Bearer header remains the primary transport.
/// </summary>
public static class CookieExtensions
{
    public const string CookieName = "cvm_token";

    /// <remarks>
    /// SameSite=Lax blocks the cookie on cross-site state-changing requests, and the API
    /// is JSON-only with no form handlers, so no CSRF token is required. HttpOnly means
    /// XSS cannot exfiltrate the token — unlike localStorage.
    /// </remarks>
    public static void SetAuthCookie(this HttpResponse response, string token, DateTimeOffset expiresAt, bool isDevelopment)
    {
        response.Cookies.Append(CookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expiresAt,
        });
    }

    public static void ClearAuthCookie(this HttpResponse response, bool isDevelopment)
    {
        response.Cookies.Delete(CookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = SameSiteMode.Lax,
            Path = "/",
        });
    }
}
