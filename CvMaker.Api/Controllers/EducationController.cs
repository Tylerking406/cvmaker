using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/cvs/{cvId}/education")]
public class EducationController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid cvId)
    {
        var items = await db.Educations
            .Where(e => e.CvId == cvId)
            .OrderBy(e => e.OrderIndex)
            .Select(e => MapToResponse(e))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid cvId, EducationRequest request)
    {
        var item = new Education
        {
            CvId = cvId,
            Institution = request.Institution,
            Degree = request.Degree,
            Field = request.Field,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsCurrent = request.IsCurrent,
            Achievements = request.Achievements,
            OrderIndex = request.OrderIndex
        };

        db.Educations.Add(item);
        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid cvId, Guid id, EducationRequest request)
    {
        var item = await db.Educations.FirstOrDefaultAsync(e => e.Id == id && e.CvId == cvId);
        if (item is null) return NotFound();

        item.Institution = request.Institution;
        item.Degree = request.Degree;
        item.Field = request.Field;
        item.StartDate = request.StartDate;
        item.EndDate = request.EndDate;
        item.IsCurrent = request.IsCurrent;
        item.Achievements = request.Achievements;
        item.OrderIndex = request.OrderIndex;

        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid cvId, Guid id)
    {
        var item = await db.Educations.FirstOrDefaultAsync(e => e.Id == id && e.CvId == cvId);
        if (item is null) return NotFound();

        db.Educations.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static EducationResponse MapToResponse(Education e) =>
        new(e.Id, e.CvId, e.Institution, e.Degree, e.Field, e.StartDate, e.EndDate, e.IsCurrent, e.Achievements, e.OrderIndex);
}
