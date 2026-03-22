using CvMaker.Api.Data;
using CvMaker.Api.DTOs;
using CvMaker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Controllers;

[ApiController]
[Route("api/cvs/{cvId}/certifications")]
public class CertificationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid cvId)
    {
        var items = await db.Certifications
            .Where(c => c.CvId == cvId)
            .OrderBy(c => c.OrderIndex)
            .Select(c => MapToResponse(c))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid cvId, CertificationRequest request)
    {
        var item = new Certification
        {
            CvId = cvId,
            Name = request.Name,
            Issuer = request.Issuer,
            IssueDate = request.IssueDate,
            ExpiryDate = request.ExpiryDate,
            Url = request.Url,
            OrderIndex = request.OrderIndex
        };

        db.Certifications.Add(item);
        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid cvId, Guid id, CertificationRequest request)
    {
        var item = await db.Certifications.FirstOrDefaultAsync(c => c.Id == id && c.CvId == cvId);
        if (item is null) return NotFound();

        item.Name = request.Name;
        item.Issuer = request.Issuer;
        item.IssueDate = request.IssueDate;
        item.ExpiryDate = request.ExpiryDate;
        item.Url = request.Url;
        item.OrderIndex = request.OrderIndex;

        await db.SaveChangesAsync();

        return Ok(MapToResponse(item));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid cvId, Guid id)
    {
        var item = await db.Certifications.FirstOrDefaultAsync(c => c.Id == id && c.CvId == cvId);
        if (item is null) return NotFound();

        db.Certifications.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static CertificationResponse MapToResponse(Certification c) =>
        new(c.Id, c.CvId, c.Name, c.Issuer, c.IssueDate, c.ExpiryDate, c.Url, c.OrderIndex);
}
