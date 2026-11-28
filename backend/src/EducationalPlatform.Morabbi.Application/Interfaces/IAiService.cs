namespace EducationalPlatform.Morabbi.Application.Interfaces;

public record AiAssistantRequest(string Message, string? Context);

public record AiAssistantResponse(string Response, List<string> QuranSources, List<string> HadithSources);

public record AiEvaluateRequest(string TargetType, int TargetId);

public record AiEvaluateResponse(double? SuggestedPercent, string? SuggestedComment, object? SuggestedScores, List<string> Suggestions);

public record AiTranscribeResponse(string Text, double? Confidence);

public record AiOcrResponse(string Text);

public record AiLessonPlanRequest(string Subject, string? Grade, int SessionCount);

public record AiLessonPlanResponse(object? Plan, List<string> QuranSources, List<string> HadithSources);

public interface IAiService
{
    bool IsConfigured { get; }
    Task<AiAssistantResponse> AssistantAsync(int userId, string userName, string userRole, AiAssistantRequest request);
    Task<AiEvaluateResponse> EvaluateAsync(string targetType, int targetId);
    Task<AiLessonPlanResponse> GenerateLessonPlanAsync(int userId, AiLessonPlanRequest request);
    Task<AiTranscribeResponse> TranscribeAsync(byte[] audio, string fileName, string contentType);
    Task<AiOcrResponse> OcrAsync(byte[] image, string fileName, string contentType);
}
