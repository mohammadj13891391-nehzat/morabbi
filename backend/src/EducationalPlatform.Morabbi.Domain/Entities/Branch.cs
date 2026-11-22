using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_branches")]
public class Branch
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(50)")]
    public string Code { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(500)")]
    public string? Address { get; set; }

    [Column(TypeName = "nvarchar(30)")]
    public string? Phone { get; set; }

    public int? MaktabId { get; set; }

    [ForeignKey(nameof(MaktabId))]
    public Maktab? Maktab { get; set; }

    public bool IsBoys { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
