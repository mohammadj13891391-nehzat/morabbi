using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_notifications")]
public class Notification
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public MorabbiUser? User { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string Type { get; set; } = "info";

    [Column(TypeName = "nvarchar(200)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? Body { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Payload { get; set; }

    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
