using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly AppDbContext _db;

    public SearchService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<GlobalSearchResult> SearchAsync(string q, int userId, string role, int? branchId, int perType = 10)
    {
        var query = q.Trim();
        if (query.Length == 0)
        {
            return new GlobalSearchResult([], [], [], [], [], []);
        }
        var isStaff = role is "admin" or "manager" or "branch_manager" or "evaluator"
            or "brothers_skills_supervisor" or "sisters_skills_supervisor";

        // ===== reports =====
        var reportsQuery = _db.DailyReports
            .Include(r => r.Instructor).Include(r => r.Branch)
            .Where(r => r.Subject.Contains(query) || (r.Summary != null && r.Summary.Contains(query)) || r.Content.Contains(query));
        if (!isStaff) reportsQuery = reportsQuery.Where(r => r.InstructorId == userId);
        else if (role == "branch_manager" && branchId is not null) reportsQuery = reportsQuery.Where(r => r.BranchId == branchId);
        var reportRows = await reportsQuery.OrderByDescending(r => r.CreatedAt).Take(perType).ToListAsync();
        var reports = reportRows.Select(r => new SearchHit("report", r.Id, r.Subject,
            $"{r.Instructor?.Name ?? ""} • {r.Branch?.Name ?? ""}", r.Date.ToString("yyyy-MM-dd"), r.Status)).ToList();

        // ===== lesson plans =====
        var plansQuery = _db.LessonPlans
            .Include(p => p.Instructor).Include(p => p.Branch)
            .Where(p => p.Title.Contains(query) || p.Subject.Contains(query) || (p.GeneralObjective != null && p.GeneralObjective.Contains(query)));
        if (!isStaff) plansQuery = plansQuery.Where(p => p.InstructorId == userId);
        else if (role == "branch_manager" && branchId is not null) plansQuery = plansQuery.Where(p => p.BranchId == branchId);
        var planRows = await plansQuery.OrderByDescending(p => p.CreatedAt).Take(perType).ToListAsync();
        var plans = planRows.Select(p => new SearchHit("lesson_plan", p.Id, p.Title,
            $"{p.Instructor?.Name ?? ""} • {p.Branch?.Name ?? ""}", p.CreatedAt.ToString("yyyy-MM-dd"), p.Status)).ToList();

        // ===== people =====
        var peopleRows = await _db.People
            .Where(p => p.Name.Contains(query) || (p.Note != null && p.Note.Contains(query)) || (p.Grade != null && p.Grade.Contains(query)))
            .OrderBy(p => p.Name).Take(perType).ToListAsync();
        var people = peopleRows.Select(p =>
        {
            var meta = string.Join(" • ", new[] { p.Grade, p.Group }.Where(x => !string.IsNullOrWhiteSpace(x)));
            return new SearchHit("person", p.Id, p.Name,
                string.IsNullOrEmpty(meta) ? null : meta,
                p.JoinDate, null);
        }).ToList();

        // ===== quran verses =====
        var quranRows = await _db.QuranVerses
            .Where(v => v.TextAr.Contains(query) || (v.TextFa != null && v.TextFa.Contains(query)) || (v.Topic != null && v.Topic.Contains(query)))
            .OrderBy(v => v.Surah).Take(perType).ToListAsync();
        var quran = quranRows.Select(v => new SearchHit("quran", v.Id,
            $"سوره {v.Surah} — آیه {v.VerseNo}",
            Truncate(v.TextFa ?? v.TextAr, 120), null, null)).ToList();

        // ===== hadiths =====
        var hadithRows = await _db.Hadiths
            .Where(h => h.Source.Contains(query) || h.Narrator.Contains(query) || h.TextAr.Contains(query)
                || (h.TextFa != null && h.TextFa.Contains(query)) || (h.Topic != null && h.Topic.Contains(query)))
            .OrderBy(h => h.Source).Take(perType).ToListAsync();
        var hadiths = hadithRows.Select(h => new SearchHit("hadith", h.Id, h.Source,
            $"{h.Narrator}{(h.Topic is null ? "" : " • " + h.Topic)}", null, null)).ToList();

        // ===== tasks =====
        var tasks = new List<SearchHit>();
        if (!isStaff)
        {
            var myTasks = await _db.Tasks
                .Where(t => t.InstructorId == userId && t.Text.Contains(query))
                .Take(perType).ToListAsync();
            tasks = myTasks.Select(t => new SearchHit("task", t.Id, t.Text,
                t.Done ? "انجام‌شده" : "در پیش", t.Due, null)).ToList();
        }

        return new GlobalSearchResult(reports, plans, people, quran, hadiths, tasks);
    }

    private static string? Truncate(string? text, int max)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        return text.Length <= max ? text : text[..max] + "…";
    }
}
