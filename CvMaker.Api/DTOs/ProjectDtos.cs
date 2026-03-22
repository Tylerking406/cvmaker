namespace CvMaker.Api.DTOs;

public record ProjectRequest(string Name, string? Description, string[] Bullets, string? Url, int OrderIndex);

public record ProjectResponse(Guid Id, Guid CvId, string Name, string? Description, string[] Bullets, string? Url, int OrderIndex);
