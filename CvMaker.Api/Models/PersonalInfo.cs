namespace CvMaker.Api.Models;

public class PersonalInfo
{
    public Guid Id { get; set; }
    public Guid CvId { get; set; }
    public string FullName { get; set; } = null!;
    public string? JobTitle { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? LinkedIn { get; set; }
    public string? GitHub { get; set; }
    public string? Website { get; set; }
    public string? Summary { get; set; }

    public Cv Cv { get; set; } = null!;
}
