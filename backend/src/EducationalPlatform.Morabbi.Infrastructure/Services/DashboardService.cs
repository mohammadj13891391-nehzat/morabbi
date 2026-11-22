using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<object> GetSummaryAsync(int userId, string role, int? branchId)
    {
        var isStaff = role is "admin" or "manager" or "branch_manager" or "evaluator"
            or "brothers_skills_supervisor" or "sisters_skills_supervisor";

        var reportQuery = _db.DailyReports.AsQueryable();
        var planQuery = _db.LessonPlans.AsQueryable();
        if (!isStaff)
        {
            reportQuery = reportQuery.Where(r => r.InstructorId == userId);
            planQuery = planQuery.Where(p => p.InstructorId == userId);
        }
        else if (role == "branch_manager" && branchId.HasValue)
        {
            reportQuery = reportQuery.Where(r => r.BranchId == branchId);
            planQuery = planQuery.Where(p => p.BranchId == branchId);
        }

        var reports = await reportQuery
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        var plans = await planQuery
            .GroupBy(p => p.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        var user = await _db.Users.FindAsync(userId);
        var pendingApprovals = 0;
        if (role is "admin" or "manager" or "branch_manager")
        {
            pendingApprovals = await _db.Users.CountAsync(u => u.ApprovalStatus == "pending");
        }

        var recentNotifications = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync();

        return new
        {
            user = new { user?.Id, user?.Name, user?.Role, user?.BranchId, user?.TotalPoints, user?.RecognitionsCount },
            reports = CountByStatus(reports),
            lessonPlans = CountByStatus(plans),
            pendingApprovals,
            recentNotifications
        };
    }

    private static object CountByStatus(Dictionary<string, int> map)
    {
        return new
        {
            total = map.Values.Sum(),
            draft = map.GetValueOrDefault("DRAFT", 0),
            submitted = map.GetValueOrDefault("SUBMITTED", 0),
            approved = map.GetValueOrDefault("APPROVED", 0),
            returned = map.GetValueOrDefault("RETURNED", 0)
        };
    }
}
