namespace EducationalPlatform.Morabbi.Application.DTOs;

public record AuthUserDto(
    int Id,
    string Name,
    string Phone,
    string? NationalId,
    string Role,
    int? BranchId,
    int? MaktabId,
    string ApprovalStatus,
    int TotalPoints,
    int RecognitionsCount,
    string? TrainingLoop
);

public record LocalLoginRequest(string Phone, string Password);

public record LocalLoginResponse(string Token, AuthUserDto User);

public record RegisterRequest(
    string Phone,
    string Name,
    string? NationalId,
    string Password,
    string RequestedRole,
    int? BranchId,
    int? MaktabId
);

public record ApproveUserRequest(int UserId, bool Approved);

public record ChangePasswordRequest(string OldPassword, string NewPassword);
