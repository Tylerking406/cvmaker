using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/cvs/{cvId}/work-experience")]
public class WorkExperienceController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid cvId)
    {
        var items = await db.WorkExperiences
            .Where(w => w.CvId == cvId)
            .OrderBy(w => w.OrderIndex)
            .Select(w => MapToResponse(w))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid cvId, WorkExperienceRequest request)
    {
        var item = new WorkExperience
        {
            CvId = cvId,
            Company = request.Company,
            Role = request.Role,
            Location = request.Location,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsCurrent = request.IsCurrent,
            Bullets = request.Bullets,
            OrderIndex = request.OrderIndex
        };

        db.WorkExperiences.Add(item);
        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid cvId, Guid id, WorkExperienceRequest request)
    {
        var item = await db.WorkExperiences.FirstOrDefaultAsync(w => w.Id == id && w.CvId == cvId);
        if (item is null) return NotFound();

        item.Company = request.Company;
        item.Role = request.Role;
        item.Location = request.Location;
        item.StartDate = request.StartDate;
        item.EndDate = request.EndDate;
        item.IsCurrent = request.IsCurrent;
        item.Bullets = request.Bullets;
        item.OrderIndex = request.OrderIndex;

        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid cvId, Guid id)
    {
        var item = await db.WorkExperiences.FirstOrDefaultAsync(w => w.Id == id && w.CvId == cvId);
        if (item is null) return NotFound();

        db.WorkExperiences.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static WorkExperienceResponse MapToResponse(WorkExperience w) =>
        new(w.Id, w.CvId, w.Company, w.Role, w.Location, w.StartDate, w.EndDate, w.IsCurrent, w.Bullets, w.OrderIndex);
}
