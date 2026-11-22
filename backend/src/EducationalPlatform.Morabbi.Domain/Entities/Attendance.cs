using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_attendance")]
public class Attendance
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int PersonId { get; set; }

    [ForeignKey(nameof(PersonId))]
    public Person? Person { get; set; }

    [Column(TypeName = "nvarchar(20)")]
    public string Date { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(50)")]
    public string Status { get; set; } = "PRESENT";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
