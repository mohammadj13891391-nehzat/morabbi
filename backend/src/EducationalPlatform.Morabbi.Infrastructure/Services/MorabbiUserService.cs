using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using EducationalPlatform.Morabbi.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class MorabbiUserService : IMorabbiUserService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;

    public MorabbiUserService(AppDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<LocalLoginResponse?> LocalLoginAsync(string phone, string password)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Phone == phone);
        if (user is null || user.PasswordHash is null || !PasswordHasher.Verify(password, user.PasswordHash))
        {
            return null;
        }
        if (user.ApprovalStatus == "rejected") return null;
        if (user.ApprovalStatus == "pending") return null;
        if (!user.Active) return null;

        var token = _tokenService.CreateToken(user);
        return new LocalLoginResponse(token, ToDto(user));
    }

    public async Task<AuthUserDto> RegisterAsync(RegisterRequest request)
    {
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Phone == request.Phone);
        if (existing is not null)
        {
            throw new InvalidOperationException("این شماره تلفن قبلاً ثبت شده است.");
        }
        if (request.NationalId is not null)
        {
            var byNational = await _db.Users.AnyAsync(u => u.NationalId == request.NationalId);
            if (byNational) throw new InvalidOperationException("این کد ملی قبلاً ثبت شده است.");
        }

        var role = RoleNames.All.Contains(request.RequestedRole) ? request.RequestedRole : RoleNames.Coach;
        var user = new MorabbiUser
        {
            Name = request.Name,
            Phone = request.Phone,
            NationalId = request.NationalId,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Role = role,
            RequestedRole = role,
            BranchId = request.BranchId,
            MaktabId = request.MaktabId,
            ApprovalStatus = "pending"
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<List<AuthUserDto>> GetPendingApprovalsAsync()
    {
        var users = await _db.Users
            .Include(u => u.Branch)
            .Where(u => u.ApprovalStatus == "pending")
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
        return users.Select(ToDto).ToList();
    }

    public async Task<AuthUserDto> ApproveUserAsync(int userId, bool approved, string approvedByName)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found");
        user.ApprovalStatus = approved ? "approved" : "rejected";
        if (approved && user.RequestedRole is not null && RoleNames.All.Contains(user.RequestedRole))
        {
            user.Role = user.RequestedRole;
        }
        user.ApprovedBy = approvedByName;
        user.ApprovedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task ChangePasswordAsync(int userId, string oldPassword, string newPassword)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found");
        if (user.PasswordHash is null || !PasswordHasher.Verify(oldPassword, user.PasswordHash))
        {
            throw new InvalidOperationException("رمز عبور فعلی نادرست است.");
        }
        user.PasswordHash = PasswordHasher.Hash(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<AuthUserDto?> FindByIdAsync(int id)
    {
        var user = await _db.Users.FindAsync(id);
        return user is null ? null : ToDto(user);
    }

    public async Task<MorabbiUser?> FindByPhoneAsync(string phone)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Phone == phone);
    }

    public async Task<MorabbiUser?> FindByOidcSubjectAsync(string subject)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.OidcSubject == subject);
    }

    public async Task<List<AuthUserDto>> GetAllAsync()
    {
        var users = await _db.Users.Include(u => u.Branch).OrderBy(u => u.Name).ToListAsync();
        return users.Select(ToDto).ToList();
    }

    public async Task<MorabbiUser> CreateFromOidcAsync(string subject, string role, string? name = null)
    {
        var knownRole = RoleNames.All.Contains(role) ? role : RoleNames.Coach;
        var user = new MorabbiUser
        {
            Name = name ?? subject,
            Phone = $"oidc-{subject}",
            OidcSubject = subject,
            Role = knownRole,
            ApprovalStatus = RoleNames.All.Contains(role) ? "approved" : "pending",
            Active = true
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task UpdateRoleFromClaimsAsync(int userId, string role)
    {
        if (!RoleNames.All.Contains(role)) return;
        var user = await _db.Users.FindAsync(userId);
        if (user is null || user.Role == role) return;
        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static AuthUserDto ToDto(MorabbiUser u) => new(
        u.Id, u.Name, u.Phone, u.NationalId, u.Role,
        u.BranchId, u.MaktabId, u.ApprovalStatus, u.TotalPoints, u.RecognitionsCount
    );
}
