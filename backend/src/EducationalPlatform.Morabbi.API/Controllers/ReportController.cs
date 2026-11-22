using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportController : MorabbiControllerBase
{
    private readonly IDailyReportService _reportService;

    public ReportController(IMorabbiUserService userService, IDailyReportService reportService)
        : base(userService)
    {
        _reportService = reportService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
    {
        if (branchId.HasValue)
        {
            return Ok(await _reportService.GetByBranchAsync(branchId.Value));
        }
        if (IsStaff)
        {
            return Ok(await _reportService.GetAllAsync());
        }
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        return Ok(await _reportService.GetByInstructorAsync(current.Id));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var report = await _reportService.FindByIdAsync(id);
        if (report is null)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        if (!IsStaff && report.InstructorId != (await GetCurrentUserAsync())?.Id)
        {
            return StatusCode(StatusCodes.Status403Forbidden, GenericErrorMessages.Forbidden);
        }
        return Ok(report);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDailyReportRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            var report = await _reportService.CreateAsync(current.Id, request);
            return Ok(new { report });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDailyReportRequest request)
    {
        var current = await GetCurrentUserAsync();
        var report = await _reportService.FindByIdAsync(id);
        if (report is null)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        if (!IsStaff && report.InstructorId != current?.Id)
        {
            return StatusCode(StatusCodes.Status403Forbidden, GenericErrorMessages.Forbidden);
        }
        try
        {
            return Ok(new { report = await _reportService.UpdateAsync(id, request) });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpPost("{id}/return")]
    [Authorize(Roles = "evaluator,branch_manager,manager,admin")]
    public async Task<IActionResult> Return(int id, [FromBody] ReturnReportRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            await _reportService.ReturnAsync(id, current.Id, request.Comment);
            return Ok(new { message = "گزارش بازمگردانده شد." });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }
}
