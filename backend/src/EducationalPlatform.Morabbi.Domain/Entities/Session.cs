using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_sessions")]
public class Session
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int InstructorId { get; set; }

    [ForeignKey(nameof(InstructorId))]
    public MorabbiUser? Instructor { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(20)")]
    public string? Date { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string? Attendees { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string? Place { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Agenda { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Decisions { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Followup { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
