using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api")]
public class EvaluationController : MorabbiControllerBase
{
    private readonly IEvaluationService _evaluationService;

    public EvaluationController(IMorabbiUserService userService, IEvaluationService evaluationService)
        : base(userService)
    {
        _evaluationService = evaluationService;
    }

    [HttpGet("evaluation-criteria")]
    public async Task<IActionResult> GetCriteria([FromQuery] string? type)
    {
        return Ok(await _evaluationService.GetCriteriaAsync(type));
    }

    [HttpGet("evaluations")]
    public async Task<IActionResult> GetByTarget([FromQuery] string targetType, [FromQuery] int targetId)
    {
        var evaluations = await _evaluationService.GetByTargetAsync(targetType, targetId);
        return Ok(new { evaluations });
    }

    [HttpPost("evaluations")]
    [Authorize(Roles = "evaluator,branch_manager,manager,admin")]
    public async Task<IActionResult> Create([FromBody] CreateEvaluationRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            var evaluation = await _evaluationService.CreateAsync(current.Id, request);
            return Ok(new { evaluation });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpPut("evaluations/{id}")]
    [Authorize(Roles = "evaluator,branch_manager,manager,admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEvaluationRequest request)
    {
        try
        {
            var evaluation = await _evaluationService.UpdateAsync(id, request);
            return Ok(new { evaluation });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }
}
