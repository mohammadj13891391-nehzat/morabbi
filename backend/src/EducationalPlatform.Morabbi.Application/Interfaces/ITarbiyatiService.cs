using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface ITarbiyatiService
{
    // ---- Person ----
    Task<List<Person>> GetPeopleAsync();
    Task<Person> CreatePersonAsync(CreatePersonRequest request);
    Task<Person> UpdatePersonAsync(int id, UpdatePersonRequest request);
    Task DeletePersonAsync(int id);

    // ---- Attendance ----
    Task<List<Attendance>> GetAttendanceAsync(string? date);
    Task<Attendance> SetAttendanceAsync(int personId, string date, string status);
    Task<List<Attendance>> GetAttendanceHistoryAsync(int? personId, int days);

    // ---- Session ----
    Task<List<Session>> GetSessionsAsync(int? instructorId, bool all);
    Task<Session> CreateSessionAsync(int instructorId, CreateSessionRequest request);
    Task<Session> UpdateSessionAsync(int id, UpdateSessionRequest request);
    Task DeleteSessionAsync(int id);

    // ---- Task ----
    Task<List<TaskItem>> GetTasksAsync(int instructorId, bool all);
    Task<TaskItem> CreateTaskAsync(int instructorId, CreateTaskRequest request);
    Task<TaskItem> ToggleTaskAsync(int id, bool done);
    Task DeleteTaskAsync(int id);

    // ---- DailyTracker ----
    Task<List<DailyTracker>> GetTrackerAsync(int instructorId, int days);
    Task<DailyTracker> UpsertTrackerAsync(int instructorId, string date, UpsertTrackerRequest request);

    // ---- Methodology ----
    Task<List<Methodology>> GetMethodologiesAsync();
    Task<Methodology> CreateMethodologyAsync(CreateMethodologyRequest request);
    Task<Methodology> UpdateMethodologyAsync(int id, UpdateMethodologyRequest request);
    Task DeleteMethodologyAsync(int id);

    // ---- QuranVerse ----
    Task<List<QuranVerse>> GetQuranVersesAsync();
    Task<QuranVerse> CreateQuranVerseAsync(CreateQuranVerseRequest request);
    Task<QuranVerse> UpdateQuranVerseAsync(int id, UpdateQuranVerseRequest request);
    Task DeleteQuranVerseAsync(int id);

    // ---- Hadith ----
    Task<List<Hadith>> GetHadithsAsync();
    Task<Hadith> CreateHadithAsync(CreateHadithRequest request);
    Task<Hadith> UpdateHadithAsync(int id, UpdateHadithRequest request);
    Task DeleteHadithAsync(int id);
}
