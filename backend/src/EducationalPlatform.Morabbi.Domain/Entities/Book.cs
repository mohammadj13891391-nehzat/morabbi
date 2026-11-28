using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_books")]
public class Book
{
    public const string LoopMabani = "مبانی";
    public const string LoopTasis = "تأسیس";
    public const string LoopTaali = "تعالی";

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(300)")]
    public string Title { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(200)")]
    public string? Author { get; set; }

    [Column(TypeName = "nvarchar(100)")]
    public string? Category { get; set; }

    [Column(TypeName = "nvarchar(1000)")]
    public string? Description { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Content { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(100)")]
    public string Loops { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<string> GetLoops()
    {
        return Loops.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    }

    public bool MatchesLoop(string? loop)
    {
        if (string.IsNullOrWhiteSpace(loop)) return true;
        var loops = GetLoops();
        return loops.Count == 0 || loops.Contains(loop);
    }
}
