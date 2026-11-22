using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_recognitions")]
public class Recognition
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public MorabbiUser? User { get; set; }

    public int? BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string Level { get; set; } = "SPECIAL";

    [Column(TypeName = "nvarchar(200)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string? Description { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string? Period { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string? AwardedBy { get; set; }

    public bool AiSuggested { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
