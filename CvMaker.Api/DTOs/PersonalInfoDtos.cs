namespace CvMaker.Api.DTOs;

public record UpsertPersonalInfoRequest(
    string FullName,
    string? JobTitle,
    string? Email,
    string? Phone,
    string? Location,
    string? LinkedIn,
    string? GitHub,
    string? Website,
    string? Summary
);

public record PersonalInfoResponse(
    Guid Id,
    Guid CvId,
    string FullName,
    string? JobTitle,
    string? Email,
    string? Phone,
    string? Location,
    string? LinkedIn,
    string? GitHub,
    string? Website,
    string? Summary
);
