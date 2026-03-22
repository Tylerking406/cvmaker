namespace CvMaker.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    public ICollection<Cv> Cvs { get; set; } = [];
}
