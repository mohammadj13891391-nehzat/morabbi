using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class TarbiyatiService : ITarbiyatiService
{
    private readonly AppDbContext _db;

    public TarbiyatiService(AppDbContext db)
    {
        _db = db;
    }

    private async Task AwardPointsAsync(int userId, int amount, string reason, string? sourceType = null, int? sourceId = null)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return;
        user.BranchId ??= user.BranchId;
        _db.PointTransactions.Add(new PointTransaction
        {
            UserId = userId,
            BranchId = user.BranchId,
            Amount = amount,
            Reason = "MANUAL_AWARD",
            Description = reason,
            SourceType = sourceType,
            SourceId = sourceId?.ToString()
        });
        user.TotalPoints += amount;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    // ===== Person =====
    public async Task<List<Person>> GetPeopleAsync()
    {
        return await _db.People.OrderBy(p => p.Name).ToListAsync();
    }

    public async Task<Person> CreatePersonAsync(CreatePersonRequest request)
    {
        var person = new Person
        {
            Name = request.Name,
            Code = request.Code,
            Age = request.Age,
            Phone = request.Phone,
            Grade = request.Grade,
            Group = request.Group ?? string.Empty,
            JoinDate = request.JoinDate,
            Note = request.Note
        };
        _db.People.Add(person);
        await _db.SaveChangesAsync();
        return person;
    }

    public async Task<Person> UpdatePersonAsync(int id, UpdatePersonRequest request)
    {
        var person = await _db.People.FindAsync(id) ?? throw new KeyNotFoundException("Person not found");
        if (request.Name is not null) person.Name = request.Name;
        if (request.Code is not null) person.Code = request.Code;
        if (request.Age.HasValue) person.Age = request.Age;
        if (request.Phone is not null) person.Phone = request.Phone;
        if (request.Grade is not null) person.Grade = request.Grade;
        if (request.Group is not null) person.Group = request.Group;
        if (request.JoinDate is not null) person.JoinDate = request.JoinDate;
        if (request.Note is not null) person.Note = request.Note;
        await _db.SaveChangesAsync();
        return person;
    }

    public async Task DeletePersonAsync(int id)
    {
        var person = await _db.People.FindAsync(id) ?? throw new KeyNotFoundException("Person not found");
        _db.People.Remove(person);
        await _db.SaveChangesAsync();
    }

    // ===== Attendance =====
    public async Task<List<Attendance>> GetAttendanceAsync(string? date)
    {
        var d = date ?? PersianToday();
        return await _db.Attendances
            .Include(a => a.Person)
            .Where(a => a.Date == d)
            .ToListAsync();
    }

    public async Task<Attendance> SetAttendanceAsync(int personId, string date, string status)
    {
        var d = date ?? PersianToday();
        var att = await _db.Attendances.FirstOrDefaultAsync(a => a.PersonId == personId && a.Date == d);
        if (att is null)
        {
            att = new Attendance { PersonId = personId, Date = d, Status = status };
            _db.Attendances.Add(att);
        }
        else
        {
            att.Status = status;
        }
        await _db.SaveChangesAsync();
        return att;
    }

    public async Task<List<Attendance>> GetAttendanceHistoryAsync(int? personId, int days)
    {
        var query = _db.Attendances.AsQueryable();
        if (personId is not null) query = query.Where(a => a.PersonId == personId.Value);
        return await query
            .Include(a => a.Person)
            .OrderByDescending(a => a.Date)
            .Take(days * 40)
            .ToListAsync();
    }

    // ===== Session =====
    public async Task<List<Session>> GetSessionsAsync(int? instructorId, bool all)
    {
        var query = _db.Sessions.AsQueryable();
        if (!all && instructorId is not null) query = query.Where(s => s.InstructorId == instructorId);
        return await query
            .Include(s => s.Instructor)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<Session> CreateSessionAsync(int instructorId, CreateSessionRequest request)
    {
        var session = new Session
        {
            InstructorId = instructorId,
            Name = string.Empty,
            Title = request.Title,
            Date = request.Date,
            Attendees = request.Attendees,
            Place = request.Place,
            Agenda = request.Agenda,
            Decisions = request.Decisions,
            Followup = request.Followup,
            Note = request.Note
        };
        _db.Sessions.Add(session);
        await _db.SaveChangesAsync();
        await AwardPointsAsync(instructorId, 3, "ثبت صورتجلسه: " + request.Title, "session", session.Id);
        return await _db.Sessions.Include(s => s.Instructor).FirstAsync(s => s.Id == session.Id);
    }

    public async Task<Session> UpdateSessionAsync(int id, UpdateSessionRequest request)
    {
        var session = await _db.Sessions.FindAsync(id) ?? throw new KeyNotFoundException("Session not found");
        if (request.Title is not null) session.Title = request.Title;
        if (request.Date is not null) session.Date = request.Date;
        if (request.Attendees is not null) session.Attendees = request.Attendees;
        if (request.Place is not null) session.Place = request.Place;
        if (request.Agenda is not null) session.Agenda = request.Agenda;
        if (request.Decisions is not null) session.Decisions = request.Decisions;
        if (request.Followup is not null) session.Followup = request.Followup;
        if (request.Note is not null) session.Note = request.Note;
        await _db.SaveChangesAsync();
        return await _db.Sessions.Include(s => s.Instructor).FirstAsync(s => s.Id == id);
    }

    public async Task DeleteSessionAsync(int id)
    {
        var session = await _db.Sessions.FindAsync(id) ?? throw new KeyNotFoundException("Session not found");
        _db.Sessions.Remove(session);
        await _db.SaveChangesAsync();
    }

    // ===== Task =====
    public async Task<List<TaskItem>> GetTasksAsync(int instructorId, bool all)
    {
        var query = _db.Tasks.AsQueryable();
        if (!all) query = query.Where(t => t.InstructorId == instructorId);
        return await query
            .Include(t => t.Instructor)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<TaskItem> CreateTaskAsync(int instructorId, CreateTaskRequest request)
    {
        var task = new TaskItem
        {
            InstructorId = instructorId,
            Text = request.Text,
            Priority = request.Priority ?? "MED",
            Due = request.Due
        };
        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();
        return task;
    }

    public async Task<TaskItem> ToggleTaskAsync(int id, bool done)
    {
        var task = await _db.Tasks.FindAsync(id) ?? throw new KeyNotFoundException("Task not found");
        task.Done = done;
        await _db.SaveChangesAsync();
        if (done)
        {
            await AwardPointsAsync(task.InstructorId, 1, "انجام کار: " + task.Text, "task", task.Id);
        }
        return task;
    }

    public async Task DeleteTaskAsync(int id)
    {
        var task = await _db.Tasks.FindAsync(id) ?? throw new KeyNotFoundException("Task not found");
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();
    }

    // ===== DailyTracker =====
    public async Task<List<DailyTracker>> GetTrackerAsync(int instructorId, int days)
    {
        return await _db.DailyTrackers
            .Where(t => t.InstructorId == instructorId)
            .OrderByDescending(t => t.Date)
            .Take(days)
            .ToListAsync();
    }

    public async Task<DailyTracker> UpsertTrackerAsync(int instructorId, string date, UpsertTrackerRequest request)
    {
        var d = request.Date ?? date ?? PersianToday();
        var tracker = await _db.DailyTrackers.FirstOrDefaultAsync(t => t.InstructorId == instructorId && t.Date == d);
        var newlyTrue = 0;
        if (tracker is null)
        {
            tracker = new DailyTracker { InstructorId = instructorId, Date = d };
            _db.DailyTrackers.Add(tracker);
            if (request.SalatFajr) newlyTrue++;
            if (request.SalatZuhr) newlyTrue++;
            if (request.SalatAsr) newlyTrue++;
            if (request.SalatMaghrib) newlyTrue++;
            if (request.SalatIsha) newlyTrue++;
            if (request.DhikrMorning) newlyTrue++;
            if (request.DhikrEvening) newlyTrue++;
            if (request.Quran) newlyTrue++;
            if (request.Fasting) newlyTrue++;
            if (request.Study) newlyTrue++;
        }
        else
        {
            newlyTrue = CountNewlyTrue(tracker, request);
        }
        tracker.SalatFajr = request.SalatFajr;
        tracker.SalatZuhr = request.SalatZuhr;
        tracker.SalatAsr = request.SalatAsr;
        tracker.SalatMaghrib = request.SalatMaghrib;
        tracker.SalatIsha = request.SalatIsha;
        tracker.DhikrMorning = request.DhikrMorning;
        tracker.DhikrEvening = request.DhikrEvening;
        tracker.Quran = request.Quran;
        tracker.Fasting = request.Fasting;
        tracker.Study = request.Study;
        await _db.SaveChangesAsync();
        if (newlyTrue > 0)
        {
            await AwardPointsAsync(instructorId, newlyTrue, "برنامه روزانه", "tracker", tracker.Id);
        }
        return tracker;
    }

    private static int CountNewlyTrue(DailyTracker t, UpsertTrackerRequest r)
    {
        var n = 0;
        if (r.SalatFajr && !t.SalatFajr) n++;
        if (r.SalatZuhr && !t.SalatZuhr) n++;
        if (r.SalatAsr && !t.SalatAsr) n++;
        if (r.SalatMaghrib && !t.SalatMaghrib) n++;
        if (r.SalatIsha && !t.SalatIsha) n++;
        if (r.DhikrMorning && !t.DhikrMorning) n++;
        if (r.DhikrEvening && !t.DhikrEvening) n++;
        if (r.Quran && !t.Quran) n++;
        if (r.Fasting && !t.Fasting) n++;
        if (r.Study && !t.Study) n++;
        return n;
    }

    // ===== Methodology =====
    public async Task<List<Methodology>> GetMethodologiesAsync()
    {
        return await _db.Methodologies.OrderBy(m => m.Name).ToListAsync();
    }

    public async Task<Methodology> CreateMethodologyAsync(CreateMethodologyRequest request)
    {
        var m = new Methodology { Name = request.Name, Desc = request.Desc, Steps = request.Steps };
        _db.Methodologies.Add(m);
        await _db.SaveChangesAsync();
        return m;
    }

    public async Task<Methodology> UpdateMethodologyAsync(int id, UpdateMethodologyRequest request)
    {
        var m = await _db.Methodologies.FindAsync(id) ?? throw new KeyNotFoundException("Methodology not found");
        if (request.Name is not null) m.Name = request.Name;
        if (request.Desc is not null) m.Desc = request.Desc;
        if (request.Steps is not null) m.Steps = request.Steps;
        await _db.SaveChangesAsync();
        return m;
    }

    public async Task DeleteMethodologyAsync(int id)
    {
        var m = await _db.Methodologies.FindAsync(id) ?? throw new KeyNotFoundException("Methodology not found");
        _db.Methodologies.Remove(m);
        await _db.SaveChangesAsync();
    }

    // ===== QuranVerse =====
    public Task<QuranVerse?> GetQuranVerseAsync(int id)
        => _db.QuranVerses.FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<QuranVerse>> GetQuranVersesAsync(int? skip = null, int? take = null)
    {
        var query = _db.QuranVerses.OrderBy(q => q.Surah).ThenBy(q => q.VerseNo).AsQueryable();
        if (skip is not null) query = query.Skip(skip.Value);
        if (take is not null) query = query.Take(take.Value);
        return await query.ToListAsync();
    }

    private static string NormalizeArabic(string s)
    {
        var sb = new System.Text.StringBuilder(s.Length);
        foreach (var c in s)
        {
            if (c is >= '\u064B' and <= '\u0652') continue;
            if (c is '\u0640' or '\u0653' or '\u0670') continue;
            sb.Append(c == '\u0671' ? '\u0627' : c);
        }
        return sb.ToString();
    }

    public async Task<List<QuranVerse>> SearchQuranVersesAsync(string q, int? take = null)
    {
        var t = NormalizeArabic(q.Trim());
        if (string.IsNullOrEmpty(t)) return new List<QuranVerse>();
        var all = await _db.QuranVerses.OrderBy(x => x.Surah).ThenBy(x => x.VerseNo).ToListAsync();
        var results = all
            .Where(x => ArabicContains(x.TextAr, t)
                || (x.TextFa != null && ArabicContains(x.TextFa, t))
                || (x.Surah != null && ArabicContains(x.Surah, t))
                || (x.Topic != null && ArabicContains(x.Topic, t)))
            .ToList();
        if (take is not null) results = results.Take(take.Value).ToList();
        return results;
    }

    private static bool ArabicContains(string? text, string normQuery)
        => text is not null && NormalizeArabic(text).Contains(normQuery, StringComparison.Ordinal);

    public async Task<QuranVerse> CreateQuranVerseAsync(CreateQuranVerseRequest request)
    {
        var q = new QuranVerse { Surah = request.Surah, VerseNo = request.VerseNo, TextAr = request.TextAr, TextFa = request.TextFa, Topic = request.Topic };
        _db.QuranVerses.Add(q);
        await _db.SaveChangesAsync();
        return q;
    }

    public async Task<QuranVerse> UpdateQuranVerseAsync(int id, UpdateQuranVerseRequest request)
    {
        var q = await _db.QuranVerses.FindAsync(id) ?? throw new KeyNotFoundException("QuranVerse not found");
        if (request.Surah is not null) q.Surah = request.Surah;
        if (request.VerseNo.HasValue) q.VerseNo = request.VerseNo.Value;
        if (request.TextAr is not null) q.TextAr = request.TextAr;
        if (request.TextFa is not null) q.TextFa = request.TextFa;
        if (request.Topic is not null) q.Topic = request.Topic;
        await _db.SaveChangesAsync();
        return q;
    }

    public async Task DeleteQuranVerseAsync(int id)
    {
        var q = await _db.QuranVerses.FindAsync(id) ?? throw new KeyNotFoundException("QuranVerse not found");
        _db.QuranVerses.Remove(q);
        await _db.SaveChangesAsync();
    }

    // ===== Hadith =====
    public Task<Hadith?> GetHadithAsync(int id)
        => _db.Hadiths.FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Hadith>> GetHadithsAsync(int? skip = null, int? take = null)
    {
        var query = _db.Hadiths.OrderBy(h => h.Source).AsQueryable();
        if (skip is not null) query = query.Skip(skip.Value);
        if (take is not null) query = query.Take(take.Value);
        var rows = await query.ToListAsync();
        return rows.Select(h => ToListItem(h, null)).ToList();
    }

    public async Task<List<Hadith>> SearchHadithsAsync(string q, int? take = null, bool includeText = false)
    {
        var t = q.Trim();
        var query = _db.Hadiths.AsQueryable();
        if (includeText)
        {
            _db.Database.SetCommandTimeout(120);
            query = query.Where(x => EF.Functions.Like(x.TextAr, $"%{t}%"));
        }
        else
        {
            query = query.Where(x => (x.TextFa != null && EF.Functions.Like(x.TextFa, $"%{t}%"))
                || (x.Source != null && EF.Functions.Like(x.Source, $"%{t}%"))
                || (x.Narrator != null && EF.Functions.Like(x.Narrator, $"%{t}%"))
                || (x.Topic != null && EF.Functions.Like(x.Topic, $"%{t}%")));
        }
        query = query.OrderBy(x => x.Source);
        if (take is not null) query = query.Take(take.Value);
        var rows = await query.ToListAsync();
        return rows.Select(h => ToListItem(h, t)).ToList();
    }

    private const int HadithPreviewLen = 400;

    private static Hadith ToListItem(Hadith h, string? q)
    {
        if (h.TextAr.Length <= HadithPreviewLen && (h.TextFa == null || h.TextFa.Length <= HadithPreviewLen)) return h;
        return new Hadith
        {
            Id = h.Id,
            Source = h.Source,
            Narrator = h.Narrator,
            TextAr = Preview(h.TextAr, q),
            TextFa = h.TextFa != null ? Preview(h.TextFa, q) : null,
            Topic = h.Topic,
            CreatedAt = h.CreatedAt
        };
    }

    private static string Preview(string text, string? q)
    {
        if (text.Length <= HadithPreviewLen) return text;
        if (!string.IsNullOrEmpty(q))
        {
            var idx = text.IndexOf(q, StringComparison.OrdinalIgnoreCase);
            if (idx >= 0)
            {
                var start = Math.Max(0, idx - HadithPreviewLen / 4);
                var slice = text[start..Math.Min(text.Length, start + HadithPreviewLen)];
                return (start > 0 ? "…" : "") + slice + "…";
            }
        }
        return text[..HadithPreviewLen] + "…";
    }

    public async Task<Hadith> CreateHadithAsync(CreateHadithRequest request)
    {
        var h = new Hadith { Source = request.Source, Narrator = request.Narrator, TextAr = request.TextAr, TextFa = request.TextFa, Topic = request.Topic };
        _db.Hadiths.Add(h);
        await _db.SaveChangesAsync();
        return h;
    }

    public async Task<Hadith> UpdateHadithAsync(int id, UpdateHadithRequest request)
    {
        var h = await _db.Hadiths.FindAsync(id) ?? throw new KeyNotFoundException("Hadith not found");
        if (request.Source is not null) h.Source = request.Source;
        if (request.Narrator is not null) h.Narrator = request.Narrator;
        if (request.TextAr is not null) h.TextAr = request.TextAr;
        if (request.TextFa is not null) h.TextFa = request.TextFa;
        if (request.Topic is not null) h.Topic = request.Topic;
        await _db.SaveChangesAsync();
        return h;
    }

    public async Task DeleteHadithAsync(int id)
    {
        var h = await _db.Hadiths.FindAsync(id) ?? throw new KeyNotFoundException("Hadith not found");
        _db.Hadiths.Remove(h);
        await _db.SaveChangesAsync();
    }

    private static string PersianToday()
    {
        return DateTime.Now.ToString("yyyy-MM-dd");
    }
}
