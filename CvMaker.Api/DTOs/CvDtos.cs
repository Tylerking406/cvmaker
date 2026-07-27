namespace CvMaker.Api.DTOs;

// No UserId: the owner is taken from the caller's "sub" claim, never from the request.
public record CreateCvRequest(string Title, string Template = "ats-classic");
public record UpdateCvRequest(string Title, string Template);
public record CvResponse(Guid Id, Guid UserId, string Title, string Template, DateTime CreatedAt, DateTime UpdatedAt);

public record CvDetailResponse(
    Guid Id,
    Guid UserId,
    string Title,
    string Template,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    PersonalInfoResponse? PersonalInfo,
    IEnumerable<WorkExperienceResponse> WorkExperiences,
    IEnumerable<EducationResponse> Educations,
    IEnumerable<SkillResponse> Skills,
    IEnumerable<ProjectResponse> Projects,
    IEnumerable<CertificationResponse> Certifications,
    IEnumerable<AchievementResponse> Achievements
);
