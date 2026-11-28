namespace EducationalPlatform.Morabbi.Application.DTOs;

public record CreateEvaluationRequest(
    string TargetType,
    int TargetId,
    string? Scores,
    string? OverallComment,
    string? Status
);

public record UpdateEvaluationRequest(
    string? Scores,
    string? OverallComment,
    string? Status
);

public record CreateEvaluationCriterionRequest(
    string Type,
    string Title,
    string? Description,
    int Weight,
    string? RubricLevels
);

public record UpdateEvaluationCriterionRequest(
    string? Title,
    string? Description,
    int? Weight,
    string? RubricLevels,
    bool? Active
);

public record CriterionSummary(
    int Id,
    string Title,
    string? Description,
    int Weight,
    string RubricLevels,
    double? AveragePercent,
    int EvaluatedCount,
    bool Active
);

public record EvaluationDto(
    int Id,
    string Status,
    string? Scores,
    string? OverallComment,
    int EvaluatorId,
    string? EvaluatorName,
    DateTime CreatedAt
);

public record EvaluationSummaryDto(
    string TargetType,
    int TargetId,
    double? WeightedPercent,
    int CriteriaCount,
    int ScoredCount,
    List<EvaluationDto> Evaluations
);
