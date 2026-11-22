using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_point_transactions")]
public class PointTransaction
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

    public int Amount { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string Reason { get; set; } = "MANUAL_AWARD";

    [Column(TypeName = "nvarchar(500)")]
    public string? Description { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string? SourceType { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string? SourceId { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string? AwardedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
