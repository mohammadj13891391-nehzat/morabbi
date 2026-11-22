using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IMorabbiUserService
{
    Task<LocalLoginResponse?> LocalLoginAsync(string phone, string password);
    Task<AuthUserDto> RegisterAsync(RegisterRequest request);
    Task<List<AuthUserDto>> GetPendingApprovalsAsync();
    Task<AuthUserDto> ApproveUserAsync(int userId, bool approved, string approvedByName);
    Task ChangePasswordAsync(int userId, string oldPassword, string newPassword);
    Task<AuthUserDto?> FindByIdAsync(int id);
    Task<MorabbiUser?> FindByPhoneAsync(string phone);
    Task<MorabbiUser?> FindByOidcSubjectAsync(string subject);
    Task<List<AuthUserDto>> GetAllAsync();
    Task<MorabbiUser> CreateFromOidcAsync(string subject, string role, string? name = null);
    Task UpdateRoleFromClaimsAsync(int userId, string role);
}
