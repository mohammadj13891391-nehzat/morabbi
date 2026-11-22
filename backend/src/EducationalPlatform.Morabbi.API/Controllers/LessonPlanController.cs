using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/lesson-plans")]
public class LessonPlanController : MorabbiControllerBase
{
    private readonly ILessonPlanService _planService;

    public LessonPlanController(IMorabbiUserService userService, ILessonPlanService planService)
        : base(userService)
    {
        _planService = planService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
    {
        if (branchId.HasValue)
        {
            return Ok(await _planService.GetByBranchAsync(branchId.Value));
        }
        if (IsStaff)
        {
            return Ok(await _planService.GetAllAsync());
        }
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        return Ok(await _planService.GetByInstructorAsync(current.Id));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var plan = await _planService.FindByIdAsync(id);
        if (plan is null)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        if (!IsStaff && plan.InstructorId != (await GetCurrentUserAsync())?.Id)
        {
            return StatusCode(StatusCodes.Status403Forbidden, GenericErrorMessages.Forbidden);
        }
        return Ok(plan);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLessonPlanRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            var plan = await _planService.CreateAsync(current.Id, request);
            return Ok(new { lessonPlan = plan });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLessonPlanRequest request)
    {
        var current = await GetCurrentUserAsync();
        var plan = await _planService.FindByIdAsync(id);
        if (plan is null)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        if (!IsStaff && plan.InstructorId != current?.Id)
        {
            return StatusCode(StatusCodes.Status403Forbidden, GenericErrorMessages.Forbidden);
        }
        try
        {
            return Ok(new { lessonPlan = await _planService.UpdateAsync(id, request) });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpPost("{id}/return")]
    [Authorize(Roles = "evaluator,branch_manager,manager,admin")]
    public async Task<IActionResult> Return(int id, [FromBody] ReturnLessonPlanRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            await _planService.ReturnAsync(id, current.Id, request.Comment);
            return Ok(new { message = "طرح درس بازمگردانده شد." });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }
}
