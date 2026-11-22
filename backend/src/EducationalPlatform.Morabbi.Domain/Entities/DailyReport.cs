using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_daily_reports")]
public class DailyReport
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int InstructorId { get; set; }

    [ForeignKey(nameof(InstructorId))]
    public MorabbiUser? Instructor { get; set; }

    public int BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "nvarchar(300)")]
    public string Subject { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? Summary { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string? ReportPattern { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string? ReportStyle { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Content { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? Recommendations { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string? Audience { get; set; }

    public int AttendeesCount { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string QuranRefs { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string HadithRefs { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string? Challenges { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Solutions { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? PedagogicalNotes { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Attachments { get; set; } = "[]";

    [Column(TypeName = "nvarchar(50)")]
    public string TranscriptionSource { get; set; } = "MANUAL";

    public double? TranscriptionConfidence { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string PlanType { get; set; } = "daily";

    [Column(TypeName = "nvarchar(100)")]
    public string? Approach { get; set; }

    public int TraineeCount { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? StagePresentation { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? StageThinking { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? StageDiscussion { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? StageReporting { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? GroupEndurance { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? GroupSemiSpeed { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? GroupSpeed { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? EvaluationSelf { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? EvaluationResult { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string Status { get; set; } = "DRAFT";

    public int? EvaluatorId { get; set; }

    [ForeignKey(nameof(EvaluatorId))]
    public MorabbiUser? Evaluator { get; set; }

    public DateTime? EvaluatedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
