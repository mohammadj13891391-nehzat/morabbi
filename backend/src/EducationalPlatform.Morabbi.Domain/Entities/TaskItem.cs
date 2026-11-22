using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_tasks")]
public class TaskItem
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int InstructorId { get; set; }

    [ForeignKey(nameof(InstructorId))]
    public MorabbiUser? Instructor { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string Text { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(50)")]
    public string Priority { get; set; } = "MED";

    [Column(TypeName = "nvarchar(20)")]
    public string? Due { get; set; }

    public bool Done { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
