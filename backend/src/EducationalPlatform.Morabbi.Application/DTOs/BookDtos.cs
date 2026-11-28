namespace EducationalPlatform.Morabbi.Application.DTOs;

public record CreateBookRequest(
    string Title,
    string? Author,
    string? Category,
    string? Description,
    string Content,
    List<string>? Loops
);

public record UpdateBookRequest(
    string? Title,
    string? Author,
    string? Category,
    string? Description,
    string? Content,
    List<string>? Loops,
    bool? IsActive
);

public record BookSummaryDto(
    int Id,
    string Title,
    string? Author,
    string? Category,
    string? Description,
    List<string> Loops
);

public record BookDetailDto(
    int Id,
    string Title,
    string? Author,
    string? Category,
    string? Description,
    string Content,
    List<string> Loops,
    bool IsActive
);

public record SetUserLoopRequest(string Loop);
