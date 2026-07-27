using System.Security.Claims;

namespace CvMaker.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Reads the Supabase-style "sub" claim. Program.cs disables inbound claim mapping so
    /// "sub" arrives verbatim; the NameIdentifier fallback covers the case where mapping
    /// is ever re-enabled.
    /// </summary>
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue("sub")
                  ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id)
            ? id
            : throw new UnauthorizedAccessException("Token has no usable subject claim.");
    }
}
