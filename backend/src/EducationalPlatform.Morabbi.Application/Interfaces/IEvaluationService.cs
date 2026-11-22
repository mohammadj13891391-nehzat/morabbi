using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IEvaluationService
{
    Task<List<EvaluationCriteria>> GetCriteriaAsync(string? type);
    Task<Evaluation> CreateAsync(int evaluatorId, CreateEvaluationRequest request);
    Task<Evaluation> UpdateAsync(int id, UpdateEvaluationRequest request);
    Task<List<Evaluation>> GetByTargetAsync(string targetType, int targetId);
}

public interface IRecognitionService
{
    Task<object> GetBoardAsync(int? branchId);
    Task<Recognition> AwardAsync(int awardedById, AwardRecognitionRequest request);
    Task<List<Recognition>> GetRecognitionsAsync(int? userId);
    Task<List<PointTransaction>> GetPointTransactionsAsync(int userId);
}

public interface INotificationService
{
    Task<List<Notification>> GetByUserAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAllReadAsync(int userId);
    Task<Notification> CreateAsync(int userId, string type, string title, string? body = null, string? payload = null);
}

public interface IDashboardService
{
    Task<object> GetSummaryAsync(int userId, string role, int? branchId);
}
