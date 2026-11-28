using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class DailyReportService : IDailyReportService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly INehzatHubClient _nehzatHub;
    private readonly IPointsService _pointsService;

    public DailyReportService(AppDbContext db, INotificationService notificationService, INehzatHubClient nehzatHub, IPointsService pointsService)
    {
        _db = db;
        _notificationService = notificationService;
        _nehzatHub = nehzatHub;
        _pointsService = pointsService;
    }

    public async Task<DailyReport> CreateAsync(int instructorId, CreateDailyReportRequest request)
    {
        var instructor = await _db.Users.FindAsync(instructorId)
            ?? throw new KeyNotFoundException("Instructor not found");

        var branchId = request.BranchId ?? instructor.BranchId
            ?? throw new InvalidOperationException("شعبه مشخص نشده است.");

        var report = new DailyReport
        {
            InstructorId = instructorId,
            BranchId = branchId,
            Date = request.Date ?? DateTime.UtcNow,
            Subject = request.Subject,
            Summary = request.Summary,
            ReportPattern = request.ReportPattern,
            ReportStyle = request.ReportStyle,
            Content = request.Content ?? string.Empty,
            Recommendations = request.Recommendations,
            Audience = request.Audience,
            AttendeesCount = request.AttendeesCount ?? 0,
            QuranRefs = request.QuranRefs ?? "[]",
            HadithRefs = request.HadithRefs ?? "[]",
            Challenges = request.Challenges,
            Solutions = request.Solutions,
            PedagogicalNotes = request.PedagogicalNotes,
            TranscriptionSource = request.TranscriptionSource ?? "MANUAL",
            TranscriptionConfidence = request.TranscriptionConfidence,
            PlanType = request.PlanType ?? "daily",
            Approach = request.Approach,
            TraineeCount = request.TraineeCount ?? 0,
            StagePresentation = request.StagePresentation,
            StageThinking = request.StageThinking,
            StageDiscussion = request.StageDiscussion,
            StageReporting = request.StageReporting,
            GroupEndurance = request.GroupEndurance,
            GroupSemiSpeed = request.GroupSemiSpeed,
            GroupSpeed = request.GroupSpeed,
            EvaluationSelf = request.EvaluationSelf,
            Status = ValidStatus(request.Status)
        };
        _db.DailyReports.Add(report);
        await _db.SaveChangesAsync();
        await _pointsService.AwardIfNewAsync(report.InstructorId, PointRules.ReportSaved, PointRules.ReportSavedAmount, $"ثبت گزارش: {report.Subject}", "report", report.Id);
        return report;
    }

    public async Task<DailyReport> UpdateAsync(int id, UpdateDailyReportRequest request)
    {
        var report = await _db.DailyReports.FindAsync(id)
            ?? throw new KeyNotFoundException("Report not found");
        var wasApproved = report.Status == "APPROVED";
        ApplyUpdate(report, request);
        report.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (!wasApproved && report.Status == "APPROVED")
        {
            await _pointsService.AwardIfNewAsync(report.InstructorId, PointRules.ReportApproved, PointRules.ReportApprovedAmount, $"تأیید گزارش: {report.Subject}", "report", report.Id);
        }
        return report;
    }

    public async Task ReturnAsync(int id, int evaluatorId, string? comment)
    {
        var report = await _db.DailyReports.FindAsync(id)
            ?? throw new KeyNotFoundException("Report not found");
        report.Status = "RETURNED";
        report.EvaluatorId = evaluatorId;
        report.EvaluatedAt = DateTime.UtcNow;
        if (comment is not null)
        {
            report.EvaluationResult = comment;
        }
        report.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var body = comment ?? "گزارش شما توسط ارزیاب بازمگردانده شد.";
        await _notificationService.CreateAsync(
            report.InstructorId, "report_returned",
            "گزارش شما بازمگشت", body);

        var instructor = await _db.Users.FindAsync(report.InstructorId);
        if (instructor is not null)
        {
            await _nehzatHub.NotifyAsync(instructor.Phone, "warning", "گزارش شما بازمگشت", body, "/coach");
        }
    }

    public async Task<List<DailyReport>> GetByInstructorAsync(int instructorId)
    {
        return await _db.DailyReports
            .Include(r => r.Branch)
            .Where(r => r.InstructorId == instructorId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<DailyReport>> GetByBranchAsync(int branchId)
    {
        return await _db.DailyReports
            .Include(r => r.Branch)
            .Include(r => r.Instructor)
            .Where(r => r.BranchId == branchId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<DailyReport>> GetAllAsync()
    {
        return await _db.DailyReports
            .Include(r => r.Branch)
            .Include(r => r.Instructor)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<DailyReport?> FindByIdAsync(int id)
    {
        return await _db.DailyReports
            .Include(r => r.Branch)
            .Include(r => r.Instructor)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    private static void ApplyUpdate(DailyReport report, UpdateDailyReportRequest r)
    {
        if (r.Subject is not null) report.Subject = r.Subject;
        if (r.Summary is not null) report.Summary = r.Summary;
        if (r.ReportPattern is not null) report.ReportPattern = r.ReportPattern;
        if (r.ReportStyle is not null) report.ReportStyle = r.ReportStyle;
        if (r.Content is not null) report.Content = r.Content;
        if (r.Recommendations is not null) report.Recommendations = r.Recommendations;
        if (r.Audience is not null) report.Audience = r.Audience;
        if (r.AttendeesCount.HasValue) report.AttendeesCount = r.AttendeesCount.Value;
        if (r.QuranRefs is not null) report.QuranRefs = r.QuranRefs;
        if (r.HadithRefs is not null) report.HadithRefs = r.HadithRefs;
        if (r.Challenges is not null) report.Challenges = r.Challenges;
        if (r.Solutions is not null) report.Solutions = r.Solutions;
        if (r.PedagogicalNotes is not null) report.PedagogicalNotes = r.PedagogicalNotes;
        if (r.PlanType is not null) report.PlanType = r.PlanType;
        if (r.Approach is not null) report.Approach = r.Approach;
        if (r.TraineeCount.HasValue) report.TraineeCount = r.TraineeCount.Value;
        if (r.StagePresentation is not null) report.StagePresentation = r.StagePresentation;
        if (r.StageThinking is not null) report.StageThinking = r.StageThinking;
        if (r.StageDiscussion is not null) report.StageDiscussion = r.StageDiscussion;
        if (r.StageReporting is not null) report.StageReporting = r.StageReporting;
        if (r.GroupEndurance is not null) report.GroupEndurance = r.GroupEndurance;
        if (r.GroupSemiSpeed is not null) report.GroupSemiSpeed = r.GroupSemiSpeed;
        if (r.GroupSpeed is not null) report.GroupSpeed = r.GroupSpeed;
        if (r.EvaluationSelf is not null) report.EvaluationSelf = r.EvaluationSelf;
        if (ValidStatus(r.Status) is string s) report.Status = s;
    }

    private static string? ValidStatus(string? status)
    {
        return status is "DRAFT" or "SUBMITTED" or "UNDER_REVIEW" or "APPROVED" or "RETURNED" ? status : null;
    }
}
