using CvMaker.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Auth;

/// <summary>
/// Asserts that the {cvId} in the route belongs to the caller, before the action runs.
/// Applied once per child-resource controller with
/// [ServiceFilter(typeof(CvOwnershipFilter))] — seven attributes covering ~26 actions.
/// </summary>
/// <remarks>
/// [Authorize] alone is not enough: a valid token still permits passing an arbitrary
/// cvId. Short-circuiting here means no action body needs its own ownership branch, and
/// a future child controller is one attribute away from being safe rather than one
/// forgotten check away from a data leak.
/// </remarks>
public class CvOwnershipFilter(AppDbContext db) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.RouteData.Values.TryGetValue("cvId", out var raw) ||
            !Guid.TryParse(raw?.ToString(), out var cvId))
        {
            context.Result = new BadRequestResult();
            return;
        }

        var userId = context.HttpContext.User.GetUserId();
        var owned = await db.Cvs.AnyAsync(c => c.Id == cvId && c.UserId == userId);

        if (!owned)
        {
            // 404 rather than 403 — a 403 would confirm that the CV id exists.
            context.Result = new NotFoundResult();
            return;
        }

        await next();
    }
}
