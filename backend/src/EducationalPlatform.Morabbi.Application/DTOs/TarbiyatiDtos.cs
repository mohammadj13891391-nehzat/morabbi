using System.Text.Json.Serialization;

namespace EducationalPlatform.Morabbi.Application.DTOs;

// ===== Person =====
public record CreatePersonRequest(
    string Name,
    string? Code,
    int? Age,
    string? Phone,
    string? Grade,
    string Group,
    string? JoinDate,
    string? Note
);

public record UpdatePersonRequest(
    string? Name,
    string? Code,
    int? Age,
    string? Phone,
    string? Grade,
    string? Group,
    string? JoinDate,
    string? Note
);

// ===== Session =====
public record CreateSessionRequest(
    string Title,
    string? Date,
    string? Attendees,
    string? Place,
    string? Agenda,
    string? Decisions,
    string? Followup,
    string? Note
);

public record UpdateSessionRequest(
    string? Title,
    string? Date,
    string? Attendees,
    string? Place,
    string? Agenda,
    string? Decisions,
    string? Followup,
    string? Note
);

// ===== Task =====
public record CreateTaskRequest(
    string Text,
    string Priority,
    string? Due
);

public record UpdateTaskRequest(
    string? Text,
    string? Priority,
    string? Due,
    bool? Done
);

// ===== DailyTracker =====
public record UpsertTrackerRequest(
    string? Date,
    [property: JsonPropertyName("salat_fajr")] bool SalatFajr,
    [property: JsonPropertyName("salat_zuhr")] bool SalatZuhr,
    [property: JsonPropertyName("salat_asr")] bool SalatAsr,
    [property: JsonPropertyName("salat_maghrib")] bool SalatMaghrib,
    [property: JsonPropertyName("salat_isha")] bool SalatIsha,
    [property: JsonPropertyName("dhikr_morning")] bool DhikrMorning,
    [property: JsonPropertyName("dhikr_evening")] bool DhikrEvening,
    [property: JsonPropertyName("quran")] bool Quran,
    [property: JsonPropertyName("fasting")] bool Fasting,
    [property: JsonPropertyName("study")] bool Study
);

// ===== Methodology =====
public record CreateMethodologyRequest(string Name, string? Desc, string? Steps);
public record UpdateMethodologyRequest(string? Name, string? Desc, string? Steps);

// ===== QuranVerse =====
public record CreateQuranVerseRequest(string Surah, int VerseNo, string TextAr, string? TextFa, string? Topic);
public record UpdateQuranVerseRequest(string? Surah, int? VerseNo, string? TextAr, string? TextFa, string? Topic);

// ===== Hadith =====
public record CreateHadithRequest(string Source, string Narrator, string TextAr, string? TextFa, string? Topic);
public record UpdateHadithRequest(string? Source, string? Narrator, string? TextAr, string? TextFa, string? Topic);
