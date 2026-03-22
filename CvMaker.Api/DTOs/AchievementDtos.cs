namespace CvMaker.Api.DTOs;

public record AchievementRequest(string Description, int OrderIndex);

public record AchievementResponse(Guid Id, Guid CvId, string Description, int OrderIndex);
