namespace EducationalPlatform.Morabbi.Application.DTOs;

public record AwardRecognitionRequest(
    int UserId,
    string Level,
    string Title,
    string? Description,
    string? Period,
    int Points
);
