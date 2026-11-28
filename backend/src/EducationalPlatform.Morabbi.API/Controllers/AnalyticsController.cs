using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : MorabbiControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IMorabbiUserService userService, IAnalyticsService analyticsService)
        : base(userService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnalysis([FromQuery] string? scope, [FromQuery] int? maktabId)
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        return Ok(await _analyticsService.GetAnalysisAsync(current.Id, current.Role, CurrentBranchId, scope, maktabId));
    }

    [HttpGet("charts")]
    public async Task<IActionResult> GetCharts()
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        return Ok(await _analyticsService.GetChartsAsync(current.Id, current.Role, CurrentBranchId));
    }

    [HttpGet("instructors")]
    [Authorize(Roles = "admin,manager,branch_manager,brothers_skills_supervisor,sisters_skills_supervisor")]
    public async Task<IActionResult> GetInstructors([FromQuery] int? branchId, [FromQuery] int? maktabId)
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        if (current.Role == "branch_manager")
        {
            return Ok(await _analyticsService.GetInstructorsAsync(CurrentBranchId, null));
        }
        return Ok(await _analyticsService.GetInstructorsAsync(branchId, maktabId));
    }
}
