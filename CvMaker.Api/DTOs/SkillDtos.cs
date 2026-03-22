namespace CvMaker.Api.DTOs;

public record SkillRequest(string Category, string[] Items, int OrderIndex);

public record SkillResponse(Guid Id, Guid CvId, string Category, string[] Items, int OrderIndex);
