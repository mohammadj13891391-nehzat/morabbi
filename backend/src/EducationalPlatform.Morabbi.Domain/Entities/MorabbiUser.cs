using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_users")]
public class MorabbiUser
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(20)")]
    public string? NationalId { get; set; }

    [Column(TypeName = "nvarchar(30)")]
    public string Phone { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    [JsonIgnore]
    public string? PasswordHash { get; set; }

    [Column(TypeName = "nvarchar(255)")]
    public string? OidcSubject { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string Role { get; set; } = "coach";

    [Column(TypeName = "nvarchar(50)")]
    public string? RequestedRole { get; set; }

    public int? BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch? Branch { get; set; }

    public int? MaktabId { get; set; }

    [ForeignKey(nameof(MaktabId))]
    public Maktab? Maktab { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string ApprovalStatus { get; set; } = "pending";

    [Column(TypeName = "nvarchar(200)")]
    public string? ApprovedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }
    public bool Active { get; set; } = true;
    public int TotalPoints { get; set; }
    public int RecognitionsCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
