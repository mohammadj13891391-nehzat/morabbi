using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_push_subscriptions")]
public class PushSubscription
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public MorabbiUser? User { get; set; }

    [Column(TypeName = "nvarchar(1000)")]
    public string Endpoint { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(256)")]
    public string P256dh { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(256)")]
    public string Auth { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
