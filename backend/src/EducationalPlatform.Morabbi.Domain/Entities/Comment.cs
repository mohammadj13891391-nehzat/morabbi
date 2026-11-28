using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_comments")]
public class Comment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string TargetType { get; set; } = "report";

    public int TargetId { get; set; }

    public int AuthorId { get; set; }

    [ForeignKey(nameof(AuthorId))]
    public MorabbiUser? Author { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Body { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(200)")]
    public string? Anchor { get; set; }

    public int? ParentId { get; set; }

    [ForeignKey(nameof(ParentId))]
    public Comment? Parent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
