using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class EvaluationService : IEvaluationService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly INehzatHubClient _nehzatHub;

    public EvaluationService(AppDbContext db, INotificationService notificationService, INehzatHubClient nehzatHub)
    {
        _db = db;
        _notificationService = notificationService;
        _nehzatHub = nehzatHub;
    }

    public async Task<List<EvaluationCriteria>> GetCriteriaAsync(string? type)
    {
        var query = _db.EvaluationCriteria.Where(c => c.Active).AsQueryable();
        if (type is not null)
        {
            var normalized = type.Trim().ToUpperInvariant() == "LESSON_PLAN" ? "LESSON_PLAN" : "REPORT";
            query = query.Where(c => c.Type == normalized);
        }
        return await query.OrderBy(c => c.Id).ToListAsync();
    }

    public async Task<Evaluation> CreateAsync(int evaluatorId, CreateEvaluationRequest request)
    {
        var evaluation = new Evaluation
        {
            TargetType = request.TargetType,
            TargetId = request.TargetId,
            EvaluatorId = evaluatorId,
            Scores = request.Scores ?? "{}",
            OverallComment = request.OverallComment,
            Status = request.Status is "FINAL" or "REVISED" ? request.Status : "DRAFT"
        };
        _db.Evaluations.Add(evaluation);
        await _db.SaveChangesAsync();

        if (evaluation.Status == "FINAL")
        {
            await MarkTargetEvaluatedAsync(evaluation);
        }

        return await _db.Evaluations
            .Include(e => e.Evaluator)
            .FirstAsync(e => e.Id == evaluation.Id);
    }

    public async Task<Evaluation> UpdateAsync(int id, UpdateEvaluationRequest request)
    {
        var evaluation = await _db.Evaluations.FindAsync(id)
            ?? throw new KeyNotFoundException("Evaluation not found");
        if (request.Scores is not null) evaluation.Scores = request.Scores;
        if (request.OverallComment is not null) evaluation.OverallComment = request.OverallComment;
        if (request.Status is "FINAL" or "REVISED" or "DRAFT") evaluation.Status = request.Status;
        evaluation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (evaluation.Status == "FINAL")
        {
            await MarkTargetEvaluatedAsync(evaluation);
        }

        return await _db.Evaluations
            .Include(e => e.Evaluator)
            .FirstAsync(e => e.Id == evaluation.Id);
    }

    public async Task<List<Evaluation>> GetByTargetAsync(string targetType, int targetId)
    {
        return await _db.Evaluations
            .Include(e => e.Evaluator)
            .Where(e => e.TargetType == targetType && e.TargetId == targetId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    private async Task MarkTargetEvaluatedAsync(Evaluation evaluation)
    {
        var comment = evaluation.OverallComment ?? string.Empty;
        if (evaluation.TargetType == "report")
        {
            var report = await _db.DailyReports.FindAsync(evaluation.TargetId);
            if (report is not null)
            {
                report.Status = "APPROVED";
                report.EvaluatorId = evaluation.EvaluatorId;
                report.EvaluatedAt = DateTime.UtcNow;
                if (comment.Length > 0) report.EvaluationResult = comment;
                report.UpdatedAt = DateTime.UtcNow;
                var body = comment.Length > 0 ? comment : "گزارش شما ارزیابی و تأیید شد.";
                await _notificationService.CreateAsync(report.InstructorId, "evaluation_done",
                    "گزارش شما ارزیابی شد", body);
                var instructor = await _db.Users.FindAsync(report.InstructorId);
                if (instructor is not null)
                {
                    await _nehzatHub.NotifyAsync(instructor.Phone, "success", "گزارش شما ارزیابی شد", body, "/coach");
                }
            }
        }
        else if (evaluation.TargetType == "lesson_plan")
        {
            var plan = await _db.LessonPlans.FindAsync(evaluation.TargetId);
            if (plan is not null)
            {
                plan.Status = "APPROVED";
                plan.EvaluatorId = evaluation.EvaluatorId;
                plan.EvaluatedAt = DateTime.UtcNow;
                if (comment.Length > 0) plan.EvaluationResult = comment;
                plan.UpdatedAt = DateTime.UtcNow;
                var body = comment.Length > 0 ? comment : "طرح درس شما ارزیابی و تأیید شد.";
                await _notificationService.CreateAsync(plan.InstructorId, "evaluation_done",
                    "طرح درس شما ارزیابی شد", body);
                var instructor = await _db.Users.FindAsync(plan.InstructorId);
                if (instructor is not null)
                {
                    await _nehzatHub.NotifyAsync(instructor.Phone, "success", "طرح درس شما ارزیابی شد", body, "/coach");
                }
            }
        }
        await _db.SaveChangesAsync();
    }
}
