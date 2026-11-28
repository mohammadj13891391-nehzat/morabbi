using EducationalPlatform.Morabbi.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Maktab> Maktabs => Set<Maktab>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<MorabbiUser> Users => Set<MorabbiUser>();
    public DbSet<DailyReport> DailyReports => Set<DailyReport>();
    public DbSet<LessonPlan> LessonPlans => Set<LessonPlan>();
    public DbSet<EvaluationCriteria> EvaluationCriteria => Set<EvaluationCriteria>();
    public DbSet<Evaluation> Evaluations => Set<Evaluation>();
    public DbSet<PointTransaction> PointTransactions => Set<PointTransaction>();
    public DbSet<Recognition> Recognitions => Set<Recognition>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();
    public DbSet<Person> People => Set<Person>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<DailyTracker> DailyTrackers => Set<DailyTracker>();
    public DbSet<Methodology> Methodologies => Set<Methodology>();
    public DbSet<QuranVerse> QuranVerses => Set<QuranVerse>();
    public DbSet<Hadith> Hadiths => Set<Hadith>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Book> Books => Set<Book>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Maktab>(entity =>
        {
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasOne(e => e.Maktab)
                .WithMany()
                .HasForeignKey(e => e.MaktabId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MorabbiUser>(entity =>
        {
            entity.HasIndex(e => e.Phone).IsUnique();
            entity.HasIndex(e => e.NationalId).IsUnique();
            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Maktab)
                .WithMany()
                .HasForeignKey(e => e.MaktabId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DailyReport>(entity =>
        {
            entity.HasOne(e => e.Instructor)
                .WithMany()
                .HasForeignKey(e => e.InstructorId)
                .OnDelete(DeleteBehavior.ClientCascade);
            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Evaluator)
                .WithMany()
                .HasForeignKey(e => e.EvaluatorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<LessonPlan>(entity =>
        {
            entity.HasOne(e => e.Instructor)
                .WithMany()
                .HasForeignKey(e => e.InstructorId)
                .OnDelete(DeleteBehavior.ClientCascade);
            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Evaluator)
                .WithMany()
                .HasForeignKey(e => e.EvaluatorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Evaluation>(entity =>
        {
            entity.HasIndex(e => new { e.TargetType, e.TargetId });
            entity.HasOne(e => e.Evaluator)
                .WithMany()
                .HasForeignKey(e => e.EvaluatorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PointTransaction>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Recognition>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PushSubscription>(entity =>
        {
            entity.HasIndex(e => e.Endpoint).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Person>(entity =>
        {
            entity.HasIndex(e => e.Name);
        });

        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasIndex(e => new { e.PersonId, e.Date }).IsUnique();
            entity.HasOne(e => e.Person)
                .WithMany()
                .HasForeignKey(e => e.PersonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasOne(e => e.Instructor)
                .WithMany()
                .HasForeignKey(e => e.InstructorId)
                .OnDelete(DeleteBehavior.ClientCascade);
        });

        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.HasOne(e => e.Instructor)
                .WithMany()
                .HasForeignKey(e => e.InstructorId)
                .OnDelete(DeleteBehavior.ClientCascade);
        });

        modelBuilder.Entity<DailyTracker>(entity =>
        {
            entity.HasIndex(e => new { e.InstructorId, e.Date }).IsUnique();
            entity.HasOne(e => e.Instructor)
                .WithMany()
                .HasForeignKey(e => e.InstructorId)
                .OnDelete(DeleteBehavior.ClientCascade);
        });

        modelBuilder.Entity<Methodology>(entity =>
        {
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<QuranVerse>(entity =>
        {
            entity.HasIndex(e => e.Surah);
        });

        modelBuilder.Entity<Hadith>(entity =>
        {
            entity.HasIndex(e => e.Source);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasIndex(e => new { e.TargetType, e.TargetId });
            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Parent)
                .WithMany()
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}
