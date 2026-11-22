using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Authorize]
public abstract class MorabbiControllerBase : ControllerBase
{
    protected readonly IMorabbiUserService _userService;

    protected MorabbiControllerBase(IMorabbiUserService userService)
    {
        _userService = userService;
    }

    protected async Task<MorabbiUser?> GetCurrentUserAsync()
    {
        var sub = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(sub)) return null;
        return await _userService.FindByPhoneAsync(sub)
            ?? await _userService.FindByOidcSubjectAsync(sub);
    }

    protected string CurrentRole => User.FindFirst("role")?.Value ?? string.Empty;

    protected bool IsStaff => CurrentRole is "admin" or "manager" or "branch_manager" or "evaluator"
        or "brothers_skills_supervisor" or "sisters_skills_supervisor";

    protected int? CurrentBranchId
    {
        get
        {
            var fromClaim = User.FindFirst("branchId")?.Value;
            if (int.TryParse(fromClaim, out var branchId)) return branchId;
            return null;
        }
    }
}
