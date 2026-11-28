using EducationalPlatform.Morabbi.Application.DTOs;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IAnalyticsService
{
    Task<AnalyticsResult> GetAnalysisAsync(int userId, string role, int? branchId, string? scope, int? maktabId);
    Task<ChartsResult> GetChartsAsync(int userId, string role, int? branchId);
    Task<List<InstructorStatDto>> GetInstructorsAsync(int? branchId, int? maktabId);
}
