namespace EducationalPlatform.Morabbi.Application.DTOs;

public record CriterionAnalysisDto(
    int CriterionId,
    string Title,
    string Type,
    int Weight,
    double AveragePercent,
    int EvaluatedCount,
    bool IsWeakness
);

public record AnalyticsResult(
    string Scope,
    int TotalEvaluations,
    List<CriterionAnalysisDto> CriteriaAnalysis,
    List<CriterionAnalysisDto> Weaknesses,
    string? Message
);

public record MonthPointDto(
    string Month,
    int Year,
    int Total,
    int Approved,
    int Pending,
    int Returned
);

public record StatusDistributionDto(
    int Draft,
    int Submitted,
    int UnderReview,
    int Approved,
    int Returned
);

public record MaktabComparisonDto(
    int Id,
    string Name,
    int ReportCount,
    int PlanCount
);

public record TopPerformerDto(
    int Id,
    string Name,
    string Role,
    string? BranchName,
    int TotalPoints,
    int RecognitionsCount
);

public record ChartsResult(
    List<MonthPointDto> MonthlyTrend,
    StatusDistributionDto StatusDistribution,
    List<MaktabComparisonDto> MaktabComparison,
    List<TopPerformerDto> TopPerformers
);

public record InstructorStatDto(
    int Id,
    string Name,
    string? BranchName,
    int TotalReports,
    int ApprovedReports,
    int TotalPlans,
    int ApprovedPlans,
    double? AverageEvaluationPercent,
    int TotalPoints,
    int RecognitionsCount
);
