using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/cvs/{cvId}/projects")]
public class ProjectsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid cvId)
    {
        var items = await db.Projects
            .Where(p => p.CvId == cvId)
            .OrderBy(p => p.OrderIndex)
            .Select(p => MapToResponse(p))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid cvId, ProjectRequest request)
    {
        var item = new Project
        {
            CvId = cvId,
            Name = request.Name,
            Description = request.Description,
            Bullets = request.Bullets,
            Url = request.Url,
            OrderIndex = request.OrderIndex
        };

        db.Projects.Add(item);
        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid cvId, Guid id, ProjectRequest request)
    {
        var item = await db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.CvId == cvId);
        if (item is null) return NotFound();

        item.Name = request.Name;
        item.Description = request.Description;
        item.Bullets = request.Bullets;
        item.Url = request.Url;
        item.OrderIndex = request.OrderIndex;

        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid cvId, Guid id)
    {
        var item = await db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.CvId == cvId);
        if (item is null) return NotFound();

        db.Projects.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static ProjectResponse MapToResponse(Project p) =>
        new(p.Id, p.CvId, p.Name, p.Description, p.Bullets, p.Url, p.OrderIndex);
}
