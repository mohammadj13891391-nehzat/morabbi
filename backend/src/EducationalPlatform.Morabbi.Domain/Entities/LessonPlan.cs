using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_lesson_plans")]
public class LessonPlan
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

    [Column(TypeName = "nvarchar(300)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(300)")]
    public string Subject { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(100)")]
    public string? Grade { get; set; }

    public int SessionCount { get; set; } = 1;

    [Column(TypeName = "nvarchar(max)")]
    public string? GeneralObjective { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Objectives { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string? BehavioralObjectives { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? SubHeadings { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Prerequisites { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? DiagnosticEvaluation { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? PreparationPhase { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? IntroductionPhase { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? PresentationPhase { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? SummaryPhase { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? EvaluationPhase { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? SupplementaryActivities { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? TeachingMethod { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? TeachingAids { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? EvaluationQuestions { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? ContentOutline { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? EvaluationMethod { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string QuranRefs { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string HadithRefs { get; set; } = "[]";

    [Column(TypeName = "nvarchar(max)")]
    public string Sources { get; set; } = "[]";

    [Column(TypeName = "nvarchar(50)")]
    public string PlanType { get; set; } = "biweekly";

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
