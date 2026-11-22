using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_methodologies")]
public class Methodology
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(1000)")]
    public string? Desc { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Steps { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
