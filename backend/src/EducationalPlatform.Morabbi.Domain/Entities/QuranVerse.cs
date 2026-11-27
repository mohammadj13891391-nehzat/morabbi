using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_quran_verses")]
public class QuranVerse
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string Surah { get; set; } = string.Empty;

    [Column(TypeName = "int")]
    public int VerseNo { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string TextAr { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? TextFa { get; set; }

    [Column(TypeName = "nvarchar(200)")]
    public string? Topic { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
