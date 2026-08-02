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

    /// <summary>
    /// Stamps <see cref="Cv.UpdatedAt"/> on modified CVs.
    /// </summary>
    /// <remarks>
    /// This replaces the old `cvs_updated_at` Postgres trigger. No controller sets
    /// UpdatedAt (see CvsController.Update), so without this the column would freeze at
    /// creation time. Doing it here rather than in SQL also fixes a bug the trigger had:
    /// a DB-side mutation is invisible to the tracked entity, so PUT /api/cvs/{id} used to
    /// respond with a stale updatedAt even though the row was correct.
    ///
    /// Scope is unchanged from the trigger: only direct CV updates bump it, not edits to
    /// child rows like work experience.
    /// </remarks>
    private void StampUpdatedAt()
    {
        foreach (var entry in ChangeTracker.Entries<Cv>().Where(e => e.State == EntityState.Modified))
            entry.Entity.UpdatedAt = DateTime.UtcNow;
    }

    public override int SaveChanges()
    {
        StampUpdatedAt();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampUpdatedAt();
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Explicit table names to match schema exactly
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<Cv>().ToTable("cvs");
        modelBuilder.Entity<PersonalInfo>().ToTable("personal_info");
        modelBuilder.Entity<WorkExperience>().ToTable("work_experience");
        modelBuilder.Entity<Education>().ToTable("education");
        modelBuilder.Entity<Skill>().ToTable("skills");
        modelBuilder.Entity<Project>().ToTable("projects");
        modelBuilder.Entity<Certification>().ToTable("certifications");
        modelBuilder.Entity<Achievement>().ToTable("achievements");

        // Backstop for the duplicate-email check in AuthController.Register, which is a
        // read-then-write and therefore racy on its own.
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // Fix abbreviations that snake_case gets wrong
        modelBuilder.Entity<PersonalInfo>().Property(p => p.LinkedIn).HasColumnName("linkedin");
        modelBuilder.Entity<PersonalInfo>().Property(p => p.GitHub).HasColumnName("github");

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
