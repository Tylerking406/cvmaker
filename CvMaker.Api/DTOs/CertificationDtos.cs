namespace CvMaker.Api.DTOs;

public record CertificationRequest(
    string Name,
    string? Issuer,
    DateOnly? IssueDate,
    DateOnly? ExpiryDate,
    string? Url,
    int OrderIndex
);

public record CertificationResponse(
    Guid Id,
    Guid CvId,
    string Name,
    string? Issuer,
    DateOnly? IssueDate,
    DateOnly? ExpiryDate,
    string? Url,
    int OrderIndex
);
