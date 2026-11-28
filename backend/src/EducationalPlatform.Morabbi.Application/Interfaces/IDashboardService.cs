namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IDashboardService
{
    Task<object> GetSummaryAsync(int userId, string role, int? branchId);
}
