using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/cvs")]
public class CvsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid userId)
    {
        var cvs = await db.Cvs
            .Where(c => c.UserId == userId)
            .Select(c => new CvResponse(c.Id, c.UserId, c.Title, c.Template, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(cvs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var cv = await db.Cvs
            .Include(c => c.PersonalInfo)
            .Include(c => c.WorkExperiences)
            .Include(c => c.Educations)
            .Include(c => c.Skills)
            .Include(c => c.Projects)
            .Include(c => c.Certifications)
            .Include(c => c.Achievements)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cv is null) return NotFound();

        return Ok(cv);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCvRequest request)
    {
        var cv = new Cv
        {
            UserId = request.UserId,
            Title = request.Title,
            Template = request.Template,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Cvs.Add(cv);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = cv.Id },
            new CvResponse(cv.Id, cv.UserId, cv.Title, cv.Template, cv.CreatedAt, cv.UpdatedAt));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateCvRequest request)
    {
        var cv = await db.Cvs.FindAsync(id);
        if (cv is null) return NotFound();

        cv.Title = request.Title;
        cv.Template = request.Template;
        await db.SaveChangesAsync();

        return Ok(new CvResponse(cv.Id, cv.UserId, cv.Title, cv.Template, cv.CreatedAt, cv.UpdatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var cv = await db.Cvs.FindAsync(id);
        if (cv is null) return NotFound();

        db.Cvs.Remove(cv);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
