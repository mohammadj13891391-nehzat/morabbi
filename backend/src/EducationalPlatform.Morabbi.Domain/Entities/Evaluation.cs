using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_evaluations")]
public class Evaluation
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string TargetType { get; set; } = "report";

    public int TargetId { get; set; }

    public int EvaluatorId { get; set; }

    [ForeignKey(nameof(EvaluatorId))]
    public MorabbiUser? Evaluator { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Scores { get; set; } = "{}";

    [Column(TypeName = "nvarchar(max)")]
    public string? OverallComment { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string Status { get; set; } = "DRAFT";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
