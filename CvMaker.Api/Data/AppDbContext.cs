using CvMaker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CvMaker.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Cv> Cvs => Set<Cv>();
    public DbSet<PersonalInfo> PersonalInfos => Set<PersonalInfo>();
    public DbSet<WorkExperience> WorkExperiences => Set<WorkExperience>();
    public DbSet<Education> Educations => Set<Education>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Certification> Certifications => Set<Certification>();
    public DbSet<Achievement> Achievements => Set<Achievement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Map to exact table names from schema
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<Cv>().ToTable("cvs");
        modelBuilder.Entity<PersonalInfo>().ToTable("personal_info");
        modelBuilder.Entity<WorkExperience>().ToTable("work_experience");
        modelBuilder.Entity<Education>().ToTable("education");
        modelBuilder.Entity<Skill>().ToTable("skills");
        modelBuilder.Entity<Project>().ToTable("projects");
        modelBuilder.Entity<Certification>().ToTable("certifications");
        modelBuilder.Entity<Achievement>().ToTable("achievements");

        // postgres text[] columns
        modelBuilder.Entity<WorkExperience>().Property(e => e.Bullets).HasColumnType("text[]");
        modelBuilder.Entity<Education>().Property(e => e.Achievements).HasColumnType("text[]");
        modelBuilder.Entity<Skill>().Property(e => e.Items).HasColumnType("text[]");
        modelBuilder.Entity<Project>().Property(e => e.Bullets).HasColumnType("text[]");

        // CV -> PersonalInfo is one-to-one
        modelBuilder.Entity<Cv>()
            .HasOne(c => c.PersonalInfo)
            .WithOne(p => p.Cv)
            .HasForeignKey<PersonalInfo>(p => p.CvId);
    }
}
