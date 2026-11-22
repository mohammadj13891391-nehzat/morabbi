using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IDailyReportService
{
    Task<DailyReport> CreateAsync(int instructorId, CreateDailyReportRequest request);
    Task<DailyReport> UpdateAsync(int id, UpdateDailyReportRequest request);
    Task ReturnAsync(int id, int evaluatorId, string? comment);
    Task<List<DailyReport>> GetByInstructorAsync(int instructorId);
    Task<List<DailyReport>> GetByBranchAsync(int branchId);
    Task<List<DailyReport>> GetAllAsync();
    Task<DailyReport?> FindByIdAsync(int id);
}

public interface ILessonPlanService
{
    Task<LessonPlan> CreateAsync(int instructorId, CreateLessonPlanRequest request);
    Task<LessonPlan> UpdateAsync(int id, UpdateLessonPlanRequest request);
    Task ReturnAsync(int id, int evaluatorId, string? comment);
    Task<List<LessonPlan>> GetByInstructorAsync(int instructorId);
    Task<List<LessonPlan>> GetByBranchAsync(int branchId);
    Task<List<LessonPlan>> GetAllAsync();
    Task<LessonPlan?> FindByIdAsync(int id);
}
