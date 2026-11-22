using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EducationalPlatform.Morabbi.Domain.Entities;

[Table("Morabbi_daily_trackers")]
public class DailyTracker
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int InstructorId { get; set; }

    [ForeignKey(nameof(InstructorId))]
    public MorabbiUser? Instructor { get; set; }

    [Column(TypeName = "nvarchar(20)")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("salat_fajr")]
    public bool SalatFajr { get; set; }

    [JsonPropertyName("salat_zuhr")]
    public bool SalatZuhr { get; set; }

    [JsonPropertyName("salat_asr")]
    public bool SalatAsr { get; set; }

    [JsonPropertyName("salat_maghrib")]
    public bool SalatMaghrib { get; set; }

    [JsonPropertyName("salat_isha")]
    public bool SalatIsha { get; set; }

    [JsonPropertyName("dhikr_morning")]
    public bool DhikrMorning { get; set; }

    [JsonPropertyName("dhikr_evening")]
    public bool DhikrEvening { get; set; }

    [JsonPropertyName("quran")]
    public bool Quran { get; set; }

    [JsonPropertyName("fasting")]
    public bool Fasting { get; set; }

    [JsonPropertyName("study")]
    public bool Study { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
