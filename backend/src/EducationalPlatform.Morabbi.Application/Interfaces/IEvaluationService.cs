using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IEvaluationService
{
    Task<List<EvaluationCriteria>> GetCriteriaAsync(string? type);
    Task<EvaluationCriteria> CreateCriterionAsync(int actorId, CreateEvaluationCriterionRequest request);
    Task<EvaluationCriteria> UpdateCriterionAsync(int id, UpdateEvaluationCriterionRequest request);
    Task DeleteCriterionAsync(int id);
    Task<Evaluation> CreateAsync(int evaluatorId, CreateEvaluationRequest request);
    Task<Evaluation> UpdateAsync(int id, UpdateEvaluationRequest request);
    Task<List<Evaluation>> GetByTargetAsync(string targetType, int targetId);
    Task<List<Evaluation>> GetByEvaluatorAsync(int evaluatorId);
    Task<EvaluationSummaryDto> GetSummaryAsync(string targetType, int targetId);
}
