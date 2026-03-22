namespace CvMaker.Api.DTOs;

public record CreateCvRequest(Guid UserId, string Title, string Template = "ats-classic");
public record UpdateCvRequest(string Title, string Template);
public record CvResponse(Guid Id, Guid UserId, string Title, string Template, DateTime CreatedAt, DateTime UpdatedAt);
