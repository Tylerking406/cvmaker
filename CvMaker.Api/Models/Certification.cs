namespace CvMaker.Api.Models;

public class Certification
{
    public Guid Id { get; set; }
    public Guid CvId { get; set; }
    public string Name { get; set; } = null!;
    public string? Issuer { get; set; }
    public DateOnly? IssueDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? Url { get; set; }
    public int OrderIndex { get; set; }

    public Cv Cv { get; set; } = null!;
}
