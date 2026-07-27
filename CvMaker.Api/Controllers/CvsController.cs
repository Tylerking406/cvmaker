using CvMaker.Api.Auth;
using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

// No CvOwnershipFilter here: these routes have no {cvId}, so ownership is folded into
// each query instead. Authorization comes from the global fallback policy.
[ApiController]
[Route("api/cvs")]
public class CvsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var uid = User.GetUserId();   // hoisted: EF cannot translate the extension method
        var cvs = await db.Cvs
            .Where(c => c.UserId == uid)
            .Select(c => new CvResponse(c.Id, c.UserId, c.Title, c.Template, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(cvs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var uid = User.GetUserId();
        var cv = await db.Cvs
            .Include(c => c.PersonalInfo)
            .Include(c => c.WorkExperiences)
            .Include(c => c.Educations)
            .Include(c => c.Skills)
            .Include(c => c.Projects)
            .Include(c => c.Certifications)
            .Include(c => c.Achievements)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid);

        // 404 rather than 403 for someone else's CV — a 403 would confirm the id exists.
        if (cv is null) return NotFound();

        return Ok(new CvDetailResponse(
            cv.Id, cv.UserId, cv.Title, cv.Template, cv.CreatedAt, cv.UpdatedAt,
            cv.PersonalInfo is null ? null : new PersonalInfoResponse(
                cv.PersonalInfo.Id, cv.PersonalInfo.CvId, cv.PersonalInfo.FullName,
                cv.PersonalInfo.JobTitle, cv.PersonalInfo.Email, cv.PersonalInfo.Phone,
                cv.PersonalInfo.Location, cv.PersonalInfo.LinkedIn, cv.PersonalInfo.GitHub,
                cv.PersonalInfo.Website, cv.PersonalInfo.Summary),
            cv.WorkExperiences.Select(w => new WorkExperienceResponse(
                w.Id, w.CvId, w.Company, w.Role, w.Location, w.StartDate, w.EndDate, w.IsCurrent, w.Bullets, w.OrderIndex)),
            cv.Educations.Select(e => new EducationResponse(
                e.Id, e.CvId, e.Institution, e.Degree, e.Field, e.StartDate, e.EndDate, e.IsCurrent, e.Achievements, e.OrderIndex)),
            cv.Skills.Select(s => new SkillResponse(s.Id, s.CvId, s.Category, s.Items, s.OrderIndex)),
            cv.Projects.Select(p => new ProjectResponse(p.Id, p.CvId, p.Name, p.Description, p.Bullets, p.Url, p.OrderIndex)),
            cv.Certifications.Select(c => new CertificationResponse(c.Id, c.CvId, c.Name, c.Issuer, c.IssueDate, c.ExpiryDate, c.Url, c.OrderIndex)),
            cv.Achievements.Select(a => new AchievementResponse(a.Id, a.CvId, a.Description, a.OrderIndex))
        ));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCvRequest request)
    {
        var cv = new Cv
        {
            UserId = User.GetUserId(),
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
        var uid = User.GetUserId();
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid);
        if (cv is null) return NotFound();

        cv.Title = request.Title;
        cv.Template = request.Template;
        await db.SaveChangesAsync();

        return Ok(new CvResponse(cv.Id, cv.UserId, cv.Title, cv.Template, cv.CreatedAt, cv.UpdatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var uid = User.GetUserId();
        var cv = await db.Cvs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid);
        if (cv is null) return NotFound();

        db.Cvs.Remove(cv);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
