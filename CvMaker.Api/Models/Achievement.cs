namespace CvMaker.Api.Models;

public class Achievement
{
    public Guid Id { get; set; }
    public Guid CvId { get; set; }
    public string Description { get; set; } = null!;
    public int OrderIndex { get; set; }

    public Cv Cv { get; set; } = null!;
}
