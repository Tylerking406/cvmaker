namespace CvMaker.Api.Models;

public class Project
{
    public Guid Id { get; set; }
    public Guid CvId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string[] Bullets { get; set; } = [];
    public string? Url { get; set; }
    public int OrderIndex { get; set; }

    public Cv Cv { get; set; } = null!;
}
