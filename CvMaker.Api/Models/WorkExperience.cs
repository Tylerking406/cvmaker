namespace CvMaker.Api.Models;

public class WorkExperience
{
    public Guid Id { get; set; }
    public Guid CvId { get; set; }
    public string Company { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string? Location { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string[] Bullets { get; set; } = [];
    public int OrderIndex { get; set; }

    public Cv Cv { get; set; } = null!;
}
