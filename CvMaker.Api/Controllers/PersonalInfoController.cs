using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/cvs/{cvId}/personal-info")]
public class PersonalInfoController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid cvId)
    {
        var info = await db.PersonalInfos.FirstOrDefaultAsync(p => p.CvId == cvId);
        if (info is null) return NotFound();

        return Ok(MapToResponse(info));
    }

    [HttpPut]
    public async Task<IActionResult> Upsert(Guid cvId, UpsertPersonalInfoRequest request)
    {
        var info = await db.PersonalInfos.FirstOrDefaultAsync(p => p.CvId == cvId);

        if (info is null)
        {
            info = new PersonalInfo { CvId = cvId };
            db.PersonalInfos.Add(info);
        }

        info.FullName = request.FullName;
        info.JobTitle = request.JobTitle;
        info.Email = request.Email;
        info.Phone = request.Phone;
        info.Location = request.Location;
        info.LinkedIn = request.LinkedIn;
        info.GitHub = request.GitHub;
        info.Website = request.Website;
        info.Summary = request.Summary;

        await db.SaveChangesAsync();

        return Ok(MapToResponse(info));
    }

    private static PersonalInfoResponse MapToResponse(PersonalInfo p) =>
        new(p.Id, p.CvId, p.FullName, p.JobTitle, p.Email, p.Phone, p.Location, p.LinkedIn, p.GitHub, p.Website, p.Summary);
}
