namespace CvMaker.Api.Models;

public class Skill
{
    public Guid Id { get; set; }
    public Guid CvId { get; set; }
    public string Category { get; set; } = null!;
    public string[] Items { get; set; } = [];
    public int OrderIndex { get; set; }

    public Cv Cv { get; set; } = null!;
}
