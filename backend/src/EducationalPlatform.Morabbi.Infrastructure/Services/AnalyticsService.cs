using System.Linq.Expressions;
using System.Globalization;
using System.Text.Json.Nodes;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private static readonly PersianCalendar Persian = new();

    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AnalyticsResult> GetAnalysisAsync(int userId, string role, int? branchId, string? scope, int? maktabId)
    {
        var (reportWhere, planWhere, scopeLabel) = ResolveScope(userId, role, branchId, scope, maktabId);

        var reportIds = await _db.DailyReports
            .Where(reportWhere)
            .Select(r => r.Id)
            .ToListAsync();
        var planIds = await _db.LessonPlans
            .Where(planWhere)
            .Select(p => p.Id)
            .ToListAsync();

        var reportEvaluations = await _db.Evaluations
            .Where(e => e.TargetType == "report" && e.Status == "FINAL" && reportIds.Contains(e.TargetId))
            .Select(e => new { e.Scores, e.TargetId })
            .ToListAsync();
        var planEvaluations = await _db.Evaluations
            .Where(e => e.TargetType == "lesson_plan" && e.Status == "FINAL" && planIds.Contains(e.TargetId))
            .Select(e => new { e.Scores, e.TargetId })
            .ToListAsync();

        var reportCriteria = await _db.EvaluationCriteria
            .Where(c => c.Type == "REPORT" && c.Active)
            .ToListAsync();
        var planCriteria = await _db.EvaluationCriteria
            .Where(c => c.Type == "LESSON_PLAN" && c.Active)
            .ToListAsync();

        var totalEvaluations = reportEvaluations.Count + planEvaluations.Count;
        if (totalEvaluations == 0)
        {
            return new AnalyticsResult(scopeLabel, 0, new List<CriterionAnalysisDto>(), new List<CriterionAnalysisDto>(),
                "هنوز ارزیابی نهایی انجام نشده است.");
        }

        var analysis = new List<CriterionAnalysisDto>();
        analysis.AddRange(AggregateCriteria(reportCriteria, "REPORT", reportEvaluations.Select(e => e.Scores)));
        analysis.AddRange(AggregateCriteria(planCriteria, "LESSON_PLAN", planEvaluations.Select(e => e.Scores)));

        var weaknesses = analysis
            .Where(a => a.EvaluatedCount > 0 && a.AveragePercent < 60)
            .OrderBy(a => a.AveragePercent)
            .Take(5)
            .Select(a => a with { IsWeakness = true })
            .ToList();

        return new AnalyticsResult(scopeLabel, totalEvaluations, analysis, weaknesses, null);
    }

    public async Task<ChartsResult> GetChartsAsync(int userId, string role, int? branchId)
    {
        var (reportWhere, planWhere, _) = ResolveScope(userId, role, branchId, "all", null);

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var reports = await _db.DailyReports
            .Where(And(reportWhere, r => r.CreatedAt >= sixMonthsAgo))
            .Select(r => new { r.Status, r.CreatedAt })
            .ToListAsync();
        var plans = await _db.LessonPlans
            .Where(And(planWhere, p => p.CreatedAt >= sixMonthsAgo))
            .Select(p => new { p.Status, p.CreatedAt })
            .ToListAsync();

        var trend = BuildMonthlyTrend(reports.Select(r => r.CreatedAt).ToList(), reports.Select(r => r.Status).ToList(), plans.Select(p => p.CreatedAt).ToList());

        var allStatuses = reports.Select(r => r.Status).Concat(plans.Select(p => p.Status)).ToList();
        var distribution = new StatusDistributionDto(
            allStatuses.Count(s => s == "DRAFT"),
            allStatuses.Count(s => s == "SUBMITTED"),
            allStatuses.Count(s => s == "UNDER_REVIEW"),
            allStatuses.Count(s => s == "APPROVED"),
            allStatuses.Count(s => s == "RETURNED"));

        var maktabs = await _db.Maktabs.OrderBy(m => m.Id).ToListAsync();
        var allReportRows = await _db.DailyReports
            .Where(r => r.CreatedAt >= sixMonthsAgo)
            .Select(r => new { r.BranchId })
            .ToListAsync();
        var allPlanRows = await _db.LessonPlans
            .Where(p => p.CreatedAt >= sixMonthsAgo)
            .Select(p => new { p.BranchId })
            .ToListAsync();
        var branchToMaktab = await _db.Branches
            .Select(b => new { b.Id, b.MaktabId })
            .ToDictionaryAsync(b => b.Id, b => b.MaktabId);

        var comparison = maktabs.Select(m => new MaktabComparisonDto(
            m.Id,
            m.Name,
            allReportRows.Count(r => branchToMaktab.GetValueOrDefault(r.BranchId) == m.Id),
            allPlanRows.Count(p => branchToMaktab.GetValueOrDefault(p.BranchId) == m.Id)))
            .ToList();

        var canSeePerformers = role is "admin" or "manager" or "branch_manager"
            or "brothers_skills_supervisor" or "sisters_skills_supervisor";
        List<TopPerformerDto> performers = new();
        if (canSeePerformers)
        {
            var query = _db.Users
                .Include(u => u.Branch)
                .Where(u => u.Role == "coach" && u.Active && u.ApprovalStatus == "approved")
                .AsQueryable();
            if (role == "branch_manager" && branchId is not null)
            {
                query = query.Where(u => u.BranchId == branchId);
            }
            else if (role == "brothers_skills_supervisor")
            {
                var boysBranchIds = await _db.Branches.Where(b => b.IsBoys).Select(b => b.Id).ToListAsync();
                query = query.Where(u => u.BranchId != null && boysBranchIds.Contains(u.BranchId.Value));
            }
            else if (role == "sisters_skills_supervisor")
            {
                var girlsBranchIds = await _db.Branches.Where(b => !b.IsBoys).Select(b => b.Id).ToListAsync();
                query = query.Where(u => u.BranchId != null && girlsBranchIds.Contains(u.BranchId.Value));
            }
            performers = await query
                .OrderByDescending(u => u.TotalPoints)
                .Take(5)
                .Select(u => new TopPerformerDto(
                    u.Id, u.Name, u.Role, u.Branch != null ? u.Branch.Name : null,
                    u.TotalPoints, u.RecognitionsCount))
                .ToListAsync();
        }

        return new ChartsResult(trend, distribution, comparison, performers);
    }

    public async Task<List<InstructorStatDto>> GetInstructorsAsync(int? branchId, int? maktabId)
    {
        var branchIds = new List<int>();
        if (branchId is not null)
        {
            branchIds.Add(branchId.Value);
        }
        else if (maktabId is not null)
        {
            branchIds = await _db.Branches.Where(b => b.MaktabId == maktabId).Select(b => b.Id).ToListAsync();
        }

        var instructors = await _db.Users
            .Include(u => u.Branch)
            .Where(u => u.Role == "coach" && u.Active && u.ApprovalStatus == "approved"
                && (branchIds.Count == 0 || (u.BranchId != null && branchIds.Contains(u.BranchId.Value))))
            .OrderBy(u => u.Name)
            .ToListAsync();

        var reportStats = await _db.DailyReports
            .Where(r => branchIds.Count == 0 || branchIds.Contains(r.BranchId))
            .GroupBy(r => r.InstructorId)
            .Select(g => new
            {
                InstructorId = g.Key,
                Total = g.Count(),
                Approved = g.Count(r => r.Status == "APPROVED")
            })
            .ToDictionaryAsync(s => s.InstructorId, s => s);

        var planStats = await _db.LessonPlans
            .Where(p => branchIds.Count == 0 || branchIds.Contains(p.BranchId))
            .GroupBy(p => p.InstructorId)
            .Select(g => new
            {
                InstructorId = g.Key,
                Total = g.Count(),
                Approved = g.Count(p => p.Status == "APPROVED")
            })
            .ToDictionaryAsync(s => s.InstructorId, s => s);

        return instructors.Select(i =>
        {
            reportStats.TryGetValue(i.Id, out var rs);
            planStats.TryGetValue(i.Id, out var ps);
            return new InstructorStatDto(
                i.Id,
                i.Name,
                i.Branch?.Name,
                rs?.Total ?? 0,
                rs?.Approved ?? 0,
                ps?.Total ?? 0,
                ps?.Approved ?? 0,
                null,
                i.TotalPoints,
                i.RecognitionsCount);
        }).ToList();
    }

    // ===== helpers =====

    private static string PersianMonthName(int month)
    {
        try
        {
            var fa = CultureInfo.GetCultureInfo("fa-IR");
            return fa.DateTimeFormat.MonthNames[month - 1] ?? $"ماه {month}";
        }
        catch
        {
            return $"ماه {month}";
        }
    }

    private static Expression<Func<T, bool>> And<T>(Expression<Func<T, bool>> left, Expression<Func<T, bool>> right)
    {
        var param = Expression.Parameter(typeof(T), "x");
        var body = Expression.AndAlso(Expression.Invoke(left, param), Expression.Invoke(right, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }

    private (Expression<Func<DailyReport, bool>>, Expression<Func<LessonPlan, bool>>, string) ResolveScope(
        int userId, string role, int? branchId, string? scope, int? maktabId)
    {
        var isStaff = role is "admin" or "manager" or "branch_manager" or "evaluator"
            or "brothers_skills_supervisor" or "sisters_skills_supervisor";

        Expression<Func<DailyReport, bool>> reportWhere = r => true;
        Expression<Func<LessonPlan, bool>> planWhere = p => true;
        var label = scope ?? "all";

        if (role == "brothers_skills_supervisor")
        {
            var boys = _db.Branches.Where(b => b.IsBoys).Select(b => b.Id).ToList();
            reportWhere = r => boys.Contains(r.BranchId);
            planWhere = p => boys.Contains(p.BranchId);
            label = "پسرانه (کل)";
        }
        else if (role == "sisters_skills_supervisor")
        {
            var girls = _db.Branches.Where(b => !b.IsBoys).Select(b => b.Id).ToList();
            reportWhere = r => girls.Contains(r.BranchId);
            planWhere = p => girls.Contains(p.BranchId);
            label = "دخترانه (کل)";
        }
        else if (!isStaff || scope == "self")
        {
            reportWhere = r => r.InstructorId == userId;
            planWhere = p => p.InstructorId == userId;
            label = "فردی";
        }
        else if (scope == "maktab" && maktabId is not null)
        {
            var ids = _db.Branches.Where(b => b.MaktabId == maktabId).Select(b => b.Id).ToList();
            reportWhere = r => ids.Contains(r.BranchId);
            planWhere = p => ids.Contains(p.BranchId);
            label = $"مکتب {maktabId}";
        }
        else if (scope == "branch" && branchId is not null)
        {
            reportWhere = r => r.BranchId == branchId;
            planWhere = p => p.BranchId == branchId;
            label = $"شعبه {branchId}";
        }
        else if (role == "branch_manager" && branchId is not null)
        {
            reportWhere = r => r.BranchId == branchId;
            planWhere = p => p.BranchId == branchId;
            label = $"شعبه {branchId}";
        }

        return (reportWhere, planWhere, label);
    }

    private static List<CriterionAnalysisDto> AggregateCriteria(
        List<EvaluationCriteria> criteria, string type, IEnumerable<string> scoresJsons)
    {
        var result = new List<CriterionAnalysisDto>();
        foreach (var c in criteria)
        {
            double sum = 0;
            int count = 0;
            foreach (var json in scoresJsons)
            {
                var percent = ScoreForCriterion(json, c);
                if (percent is null) continue;
                sum += percent.Value;
                count++;
            }
            if (count == 0) continue;
            result.Add(new CriterionAnalysisDto(
                c.Id, c.Title, type, c.Weight, Math.Round(sum / count, 1), count, false));
        }
        return result.OrderByDescending(r => r.Weight * (100 - r.AveragePercent)).ToList();
    }

    private static double? ScoreForCriterion(string? scoresJson, EvaluationCriteria criterion)
    {
        if (string.IsNullOrWhiteSpace(scoresJson)) return null;
        System.Text.Json.Nodes.JsonObject? scores;
        try
        {
            scores = JsonNode.Parse(scoresJson) as JsonObject;
        }
        catch
        {
            return null;
        }
        if (scores is null || scores[criterion.Id.ToString()] is not { } node) return null;
        if (!double.TryParse(node.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var score)) return null;

        int levels = EvaluationService.CountRubricLevels(criterion.RubricLevels);
        int max = Math.Max(levels - 1, 1);
        return Math.Clamp(score, 0, max) / max * 100;
    }

    private static List<MonthPointDto> BuildMonthlyTrend(List<DateTime> reportDates, List<string> reportStatuses, List<DateTime> planDates)
    {
        var now = DateTime.UtcNow;
        int currentYear = (int)Persian.GetYear(now);
        int currentMonth = (int)Persian.GetMonth(now);

        var trend = new List<MonthPointDto>();
        for (int i = 5; i >= 0; i--)
        {
            int y = currentYear, m = currentMonth - i;
            while (m <= 0) { m += 12; y--; }
            int total = 0, approved = 0, pending = 0, returned = 0;
            for (int idx = 0; idx < reportDates.Count; idx++)
            {
                var d = reportDates[idx];
                if (Persian.GetYear(d) == y && Persian.GetMonth(d) == m)
                {
                    total++;
                    var s = reportStatuses[idx];
                    if (s == "APPROVED") approved++;
                    else if (s == "SUBMITTED" || s == "UNDER_REVIEW") pending++;
                    else if (s == "RETURNED") returned++;
                }
            }
            for (int idx = 0; idx < planDates.Count; idx++)
            {
                var d = planDates[idx];
                if (Persian.GetYear(d) == y && Persian.GetMonth(d) == m) total++;
            }
            trend.Add(new MonthPointDto($"{PersianMonthName(m)} {y:0000}", y, total, approved, pending, returned));
        }
        return trend;
    }
}
