using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/cvs/{cvId}/skills")]
public class SkillsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid cvId)
    {
        var items = await db.Skills
            .Where(s => s.CvId == cvId)
            .OrderBy(s => s.OrderIndex)
            .Select(s => MapToResponse(s))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid cvId, SkillRequest request)
    {
        var item = new Skill
        {
            CvId = cvId,
            Category = request.Category,
            Items = request.Items,
            OrderIndex = request.OrderIndex
        };

        db.Skills.Add(item);
        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid cvId, Guid id, SkillRequest request)
    {
        var item = await db.Skills.FirstOrDefaultAsync(s => s.Id == id && s.CvId == cvId);
        if (item is null) return NotFound();

        item.Category = request.Category;
        item.Items = request.Items;
        item.OrderIndex = request.OrderIndex;

        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid cvId, Guid id)
    {
        var item = await db.Skills.FirstOrDefaultAsync(s => s.Id == id && s.CvId == cvId);
        if (item is null) return NotFound();

        db.Skills.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static SkillResponse MapToResponse(Skill s) =>
        new(s.Id, s.CvId, s.Category, s.Items, s.OrderIndex);
}
