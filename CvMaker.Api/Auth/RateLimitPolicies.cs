namespace CvMaker.Api.Auth;

public static class RateLimitPolicies
{
    /// <summary>
    /// Applied to the public, unauthenticated auth endpoints. Tighter than the rest of the
    /// API because each attempt costs a bcrypt verify and because these are the endpoints
    /// worth brute-forcing.
    /// </summary>
    public const string Auth = "auth";
}
