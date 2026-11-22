using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_evaluation_criteria")]
public class EvaluationCriteria
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string Type { get; set; } = "REPORT";

    [Column(TypeName = "nvarchar(300)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string? Description { get; set; }

    public int Weight { get; set; } = 1;

    [Column(TypeName = "nvarchar(max)")]
    public string RubricLevels { get; set; } = "[]";

    public bool Active { get; set; } = true;
    public int Version { get; set; } = 1;

    [Column(TypeName = "nvarchar(200)")]
    public string? DefinedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
