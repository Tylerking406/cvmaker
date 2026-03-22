namespace CvMaker.Api.Models;

public class Cv
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = null!;
    public string Template { get; set; } = "ats-classic";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public PersonalInfo? PersonalInfo { get; set; }
    public ICollection<WorkExperience> WorkExperiences { get; set; } = [];
    public ICollection<Education> Educations { get; set; } = [];
    public ICollection<Skill> Skills { get; set; } = [];
    public ICollection<Project> Projects { get; set; } = [];
    public ICollection<Certification> Certifications { get; set; } = [];
    public ICollection<Achievement> Achievements { get; set; } = [];
}
