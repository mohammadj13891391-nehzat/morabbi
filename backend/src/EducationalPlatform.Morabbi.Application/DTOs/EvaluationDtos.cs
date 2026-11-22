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
