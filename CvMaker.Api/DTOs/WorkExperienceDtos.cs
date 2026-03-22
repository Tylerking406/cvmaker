namespace CvMaker.Api.DTOs;

public record WorkExperienceRequest(
    string Company,
    string Role,
    string? Location,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string[] Bullets,
    int OrderIndex
);

public record WorkExperienceResponse(
    Guid Id,
    Guid CvId,
    string Company,
    string Role,
    string? Location,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string[] Bullets,
    int OrderIndex
);
