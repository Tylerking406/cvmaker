namespace CvMaker.Api.DTOs;

public record EducationRequest(
    string Institution,
    string Degree,
    string? Field,
    DateOnly? StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string[] Achievements,
    int OrderIndex
);

public record EducationResponse(
    Guid Id,
    Guid CvId,
    string Institution,
    string Degree,
    string? Field,
    DateOnly? StartDate,
    DateOnly? EndDate,
    bool IsCurrent,
    string[] Achievements,
    int OrderIndex
);
