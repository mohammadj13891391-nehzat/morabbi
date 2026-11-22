using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_people")]
public class Person
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(20)")]
    public string? Code { get; set; }

    public int? Age { get; set; }

    [Column(TypeName = "nvarchar(30)")]
    public string? Phone { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string? Grade { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public string Group { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(20)")]
    public string? JoinDate { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
