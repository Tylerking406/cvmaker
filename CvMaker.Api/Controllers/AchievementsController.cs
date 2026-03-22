using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/cvs/{cvId}/achievements")]
public class AchievementsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid cvId)
    {
        var items = await db.Achievements
            .Where(a => a.CvId == cvId)
            .OrderBy(a => a.OrderIndex)
            .Select(a => MapToResponse(a))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid cvId, AchievementRequest request)
    {
        var item = new Achievement
        {
            CvId = cvId,
            Description = request.Description,
            OrderIndex = request.OrderIndex
        };

        db.Achievements.Add(item);
        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid cvId, Guid id, AchievementRequest request)
    {
        var item = await db.Achievements.FirstOrDefaultAsync(a => a.Id == id && a.CvId == cvId);
        if (item is null) return NotFound();

        item.Description = request.Description;
        item.OrderIndex = request.OrderIndex;

        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid cvId, Guid id)
    {
        var item = await db.Achievements.FirstOrDefaultAsync(a => a.Id == id && a.CvId == cvId);
        if (item is null) return NotFound();

        db.Achievements.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static AchievementResponse MapToResponse(Achievement a) =>
        new(a.Id, a.CvId, a.Description, a.OrderIndex);
}
