namespace CvMaker.Api.Models;

public class Education
{
    public Guid Id { get; set; }
    public Guid CvId { get; set; }
    public string Institution { get; set; } = null!;
    public string Degree { get; set; } = null!;
    public string? Field { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string[] Achievements { get; set; } = [];
    public int OrderIndex { get; set; }

    public Cv Cv { get; set; } = null!;
}
