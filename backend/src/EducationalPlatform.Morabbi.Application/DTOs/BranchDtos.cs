namespace EducationalPlatform.Morabbi.Application.DTOs;

public record CreateBranchRequest(
    string Name,
    string Code,
    string? Address,
    string? Phone,
    int? MaktabId,
    bool IsBoys
);

public record UpdateBranchRequest(
    string? Name,
    string? Code,
    string? Address,
    string? Phone,
    int? MaktabId,
    bool? IsBoys
);

public record CreateMaktabRequest(string Name, string Code, string? Description, bool? Active);

public record UpdateMaktabRequest(string? Name, string? Code, string? Description, bool? Active);
