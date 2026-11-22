using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api")]
public class RecognitionController : MorabbiControllerBase
{
    private readonly IRecognitionService _recognitionService;

    public RecognitionController(IMorabbiUserService userService, IRecognitionService recognitionService)
        : base(userService)
    {
        _recognitionService = recognitionService;
    }

    [HttpGet("recognition/board")]
    public async Task<IActionResult> Board([FromQuery] int? branchId)
    {
        return Ok(await _recognitionService.GetBoardAsync(branchId));
    }

    [HttpGet("recognition")]
    public async Task<IActionResult> GetAll([FromQuery] int? userId)
    {
        if (userId is null && !IsStaff)
        {
            var current = await GetCurrentUserAsync();
            if (current is null)
            {
                return Unauthorized(GenericErrorMessages.Unauthorized);
            }
            userId = current.Id;
        }
        return Ok(await _recognitionService.GetRecognitionsAsync(userId));
    }

    [HttpPost("recognition")]
    [Authorize(Roles = "evaluator,branch_manager,manager,admin")]
    public async Task<IActionResult> Award([FromBody] AwardRecognitionRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            var recognition = await _recognitionService.AwardAsync(current.Id, request);
            return Ok(new { recognition });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpGet("points")]
    public async Task<IActionResult> Points([FromQuery] int? userId)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        if (userId is null && !IsStaff) userId = current.Id;
        if (userId is null)
        {
            return BadRequest(GenericErrorMessages.Validation);
        }
        return Ok(await _recognitionService.GetPointTransactionsAsync(userId.Value));
    }
}
