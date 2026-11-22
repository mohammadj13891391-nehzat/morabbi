using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : MorabbiControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IMorabbiUserService userService, IDashboardService dashboardService)
        : base(userService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        var branchId = CurrentRole == "branch_manager" ? (current.BranchId ?? CurrentBranchId) : CurrentBranchId;
        return Ok(await _dashboardService.GetSummaryAsync(current.Id, current.Role, branchId));
    }
}
