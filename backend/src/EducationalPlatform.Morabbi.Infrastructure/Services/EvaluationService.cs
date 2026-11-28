using System.Text.Json;
using System.Text.Json.Nodes;
using EducationalPlatform.Morabbi.Application.Constants;
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
    private readonly IPointsService _pointsService;

    public EvaluationService(AppDbContext db, INotificationService notificationService, INehzatHubClient nehzatHub, IPointsService pointsService)
    {
        _db = db;
        _notificationService = notificationService;
        _nehzatHub = nehzatHub;
        _pointsService = pointsService;
    }

    // ===== Criteria CRUD =====

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

    public async Task<EvaluationCriteria> CreateCriterionAsync(int actorId, CreateEvaluationCriterionRequest request)
    {
        var actor = await _db.Users.FindAsync(actorId);
        var criterion = new EvaluationCriteria
        {
            Type = NormalizeType(request.Type),
            Title = request.Title.Trim(),
            Description = request.Description,
            Weight = Math.Clamp(request.Weight, 1, 10),
            RubricLevels = string.IsNullOrWhiteSpace(request.RubricLevels) ? "[\"عالی\",\"متوسط\",\"ضعیف\"]" : request.RubricLevels,
            Active = true,
            DefinedBy = actor?.Name
        };
        _db.EvaluationCriteria.Add(criterion);
        await _db.SaveChangesAsync();
        return criterion;
    }

    public async Task<EvaluationCriteria> UpdateCriterionAsync(int id, UpdateEvaluationCriterionRequest request)
    {
        var criterion = await _db.EvaluationCriteria.FindAsync(id)
            ?? throw new KeyNotFoundException("معیار یافت نشد.");
        if (request.Title is not null) criterion.Title = request.Title.Trim();
        if (request.Description is not null) criterion.Description = request.Description;
        if (request.Weight is not null) criterion.Weight = Math.Clamp(request.Weight.Value, 1, 10);
        if (request.RubricLevels is not null) criterion.RubricLevels = request.RubricLevels;
        if (request.Active is not null) criterion.Active = request.Active.Value;
        criterion.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return criterion;
    }

    public async Task DeleteCriterionAsync(int id)
    {
        var criterion = await _db.EvaluationCriteria.FindAsync(id)
            ?? throw new KeyNotFoundException("معیار یافت نشد.");
        criterion.Active = false;
        criterion.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    // ===== Evaluations =====

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
            await OnFinalizedAsync(evaluation);
        }

        return await GetEvaluationWithEvaluatorAsync(evaluation.Id);
    }

    public async Task<Evaluation> UpdateAsync(int id, UpdateEvaluationRequest request)
    {
        var evaluation = await _db.Evaluations.FindAsync(id)
            ?? throw new KeyNotFoundException("Evaluation not found");
        var wasFinal = evaluation.Status == "FINAL";
        if (request.Scores is not null) evaluation.Scores = request.Scores;
        if (request.OverallComment is not null) evaluation.OverallComment = request.OverallComment;
        if (request.Status is "FINAL" or "REVISED" or "DRAFT") evaluation.Status = request.Status;
        evaluation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (evaluation.Status == "FINAL" && !wasFinal)
        {
            await OnFinalizedAsync(evaluation);
        }

        return await GetEvaluationWithEvaluatorAsync(id);
    }

    public async Task<List<Evaluation>> GetByTargetAsync(string targetType, int targetId)
    {
        return await _db.Evaluations
            .Include(e => e.Evaluator)
            .Where(e => e.TargetType == targetType && e.TargetId == targetId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Evaluation>> GetByEvaluatorAsync(int evaluatorId)
    {
        return await _db.Evaluations
            .Include(e => e.Evaluator)
            .Where(e => e.EvaluatorId == evaluatorId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<EvaluationSummaryDto> GetSummaryAsync(string targetType, int targetId)
    {
        var evaluations = await GetByTargetAsync(targetType, targetId);
        var criteria = await GetCriteriaAsync(targetType == "report" ? "REPORT" : "LESSON_PLAN");
        var best = evaluations
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefault(e => e.Status == "FINAL" || e.Status == "REVISED")
            ?? evaluations.OrderByDescending(e => e.CreatedAt).FirstOrDefault();

        double? percent = best is null ? null : ComputeWeightedPercent(best.Scores, criteria);

        var evaluationDtos = evaluations
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new EvaluationDto(
                e.Id,
                e.Status,
                e.Scores,
                e.OverallComment,
                e.EvaluatorId,
                e.Evaluator?.Name,
                e.CreatedAt))
            .ToList();

        return new EvaluationSummaryDto(
            targetType,
            targetId,
            percent,
            criteria.Count,
            best is null ? 0 : CountScored(best.Scores, criteria),
            evaluationDtos);
    }

    private async Task<Evaluation> GetEvaluationWithEvaluatorAsync(int id)
    {
        return await _db.Evaluations
            .Include(e => e.Evaluator)
            .FirstAsync(e => e.Id == id);
    }

    // ===== Finalization: status + points + auto recognition =====

    private async Task OnFinalizedAsync(Evaluation evaluation)
    {
        var criteria = await GetCriteriaAsync(evaluation.TargetType == "report" ? "REPORT" : "LESSON_PLAN");
        var percent = ComputeWeightedPercent(evaluation.Scores, criteria);
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
                await _pointsService.AwardIfNewAsync(report.InstructorId, PointRules.ReportApproved, PointRules.ReportApprovedAmount, "گزارش شما تأیید شد", "report", report.Id);

                if (percent is not null && percent >= PointRules.HighEvaluationThreshold)
                {
                    await _pointsService.AwardIfNewAsync(report.InstructorId, PointRules.HighEvaluation, PointRules.HighEvaluationReportAmount,
                        $"گزارش عالی با نمره {percent:0}٪", "report", report.Id);
                    await CreateAutoRecognitionAsync(report.InstructorId, report.BranchId,
                        "گزارش درجهٔ یک", $"ارزیابی عالی گزارش «{report.Subject}» با نمره {percent:0}٪");
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
                await _pointsService.AwardIfNewAsync(plan.InstructorId, PointRules.LessonApproved, PointRules.LessonApprovedAmount, "طرح درس شما تأیید شد", "lesson_plan", plan.Id);

                if (percent is not null && percent >= PointRules.HighEvaluationThreshold)
                {
                    await _pointsService.AwardIfNewAsync(plan.InstructorId, PointRules.HighEvaluation, PointRules.HighEvaluationLessonAmount,
                        $"طرح درس عالی با نمره {percent:0}٪", "lesson_plan", plan.Id);
                    await CreateAutoRecognitionAsync(plan.InstructorId, plan.BranchId,
                        "طرح درس درجهٔ یک", $"ارزیابی عالی طرح درس «{plan.Title}» با نمره {percent:0}٪");
                }
            }
        }

        var instructorId = evaluation.TargetType == "report"
            ? (await _db.DailyReports.FindAsync(evaluation.TargetId))?.InstructorId
            : (await _db.LessonPlans.FindAsync(evaluation.TargetId))?.InstructorId;
        if (instructorId is not null)
        {
            var instructor = await _db.Users.FindAsync(instructorId.Value);
            if (instructor is not null)
            {
                var msg = percent is not null ? $"ارزیابی شما با نمره {percent:0}٪ ثبت شد." : "ارزیابی شما ثبت شد.";
                await _nehzatHub.NotifyAsync(instructor.Phone, "success", "ارزیابی ثبت شد", msg, "/coach");
            }
        }

        await _db.SaveChangesAsync();
    }

    private async Task CreateAutoRecognitionAsync(int userId, int branchId, string title, string description)
    {
        var recognition = new Recognition
        {
            UserId = userId,
            BranchId = branchId,
            Level = "SPECIAL",
            Title = title,
            Description = description,
            AwardedBy = "سیستم (تقدیر خودکار)",
            AiSuggested = false
        };
        _db.Recognitions.Add(recognition);

        var user = await _db.Users.FindAsync(userId);
        if (user is not null)
        {
            user.RecognitionsCount += 1;
            user.UpdatedAt = DateTime.UtcNow;
        }
    }

    // ===== Weighted percent =====

    public static double? ComputeWeightedPercent(string scoresJson, List<EvaluationCriteria> criteria)
    {
        if (string.IsNullOrWhiteSpace(scoresJson)) return null;
        JsonObject scores;
        try
        {
            scores = JsonNode.Parse(scoresJson) as JsonObject
                ?? throw new JsonException();
        }
        catch (JsonException)
        {
            return null;
        }

        double weightedSum = 0;
        double weightTotal = 0;
        foreach (var criterion in criteria)
        {
            if (scores[criterion.Id.ToString()] is not { } node) continue;
            if (!double.TryParse(node.ToString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var score)) continue;

            // Scores are stored as a 0-100 quality value (higher = better), matching the
            // manual form and the AI evaluator. The rubric level labels are descriptive only.
            var achieved = Math.Clamp(score, 0, 100) / 100;
            weightedSum += achieved * criterion.Weight;
            weightTotal += criterion.Weight;
        }
        return weightTotal > 0 ? weightedSum / weightTotal * 100 : null;
    }

    public static int CountScored(string scoresJson, List<EvaluationCriteria> criteria)
    {
        if (string.IsNullOrWhiteSpace(scoresJson)) return 0;
        if (JsonNode.Parse(scoresJson) is not JsonObject scores) return 0;
        return criteria.Count(c => scores[c.Id.ToString()] is not null);
    }

    public static int CountRubricLevels(string rubricJson)
    {
        if (string.IsNullOrWhiteSpace(rubricJson)) return 3;
        try
        {
            if (JsonNode.Parse(rubricJson) is JsonArray arr)
            {
                return Math.Max(arr.Count, 2);
            }
        }
        catch (JsonException)
        {
        }
        return 3;
    }

    private static string NormalizeType(string type)
    {
        return type.Trim().ToUpperInvariant() == "LESSON_PLAN" ? "LESSON_PLAN" : "REPORT";
    }
}
