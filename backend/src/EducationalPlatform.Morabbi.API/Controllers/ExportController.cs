using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api")]
public class ExportController : MorabbiControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IMorabbiUserService userService, IExportService exportService)
        : base(userService)
    {
        _exportService = exportService;
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] string type = "reports")
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        var file = await _exportService.GetCsvAsync(type, current.Id, current.Role, CurrentBranchId);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("reports/{id}/pdf")]
    public async Task<IActionResult> ReportPdf(int id)
    {
        try
        {
            var file = await _exportService.GetReportPdfAsync(id);
            return File(file.Content, file.ContentType, file.FileName);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpGet("lesson-plans/{id}/pdf")]
    public async Task<IActionResult> LessonPlanPdf(int id)
    {
        try
        {
            var file = await _exportService.GetLessonPlanPdfAsync(id);
            return File(file.Content, file.ContentType, file.FileName);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpGet("reports/monthly-pdf")]
    [Authorize(Roles = "admin,manager,branch_manager,brothers_skills_supervisor,sisters_skills_supervisor")]
    public async Task<IActionResult> MonthlyPdf([FromQuery] int year, [FromQuery] int month)
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        var branchId = current.Role == "branch_manager" ? CurrentBranchId : null;
        var file = await _exportService.GetMonthlyPdfAsync(year, month, branchId, IsStaff);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
