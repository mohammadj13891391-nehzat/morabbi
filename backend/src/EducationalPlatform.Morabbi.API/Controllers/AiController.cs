using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : MorabbiControllerBase
{
    private readonly IAiService _aiService;

    public AiController(IMorabbiUserService userService, IAiService aiService)
        : base(userService)
    {
        _aiService = aiService;
    }

    [HttpGet("status")]
    public IActionResult Status()
    {
        return Ok(new { configured = _aiService.IsConfigured });
    }

    [HttpPost("assistant")]
    public async Task<IActionResult> Assistant([FromBody] AiAssistantRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "ظ¾غŒط§ظ… ط§ظ„ط²ط§ظ…غŒ ط§ط³طھ." });
        }
        try
        {
            return Ok(await _aiService.AssistantAsync(current.Id, current.Name, current.Role, request));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = ex.Message });
        }
    }

    [HttpPost("evaluate")]
    [Authorize(Roles = "evaluator,branch_manager,manager,admin")]
    public async Task<IActionResult> Evaluate([FromBody] AiEvaluateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TargetType) || request.TargetId <= 0)
        {
            return BadRequest(new { message = "ظ†ظˆط¹ ظˆ ط´ظ†ط§ط³ظ‡ ظ‡ط¯ظپ ط§ظ„ط²ط§ظ…غŒ ط§ط³طھ." });
        }
        try
        {
            return Ok(await _aiService.EvaluateAsync(request.TargetType, request.TargetId));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = ex.Message });
        }
    }

    [HttpPost("transcribe")]
    [RequestSizeLimit(26 * 1024 * 1024)]
    public async Task<IActionResult> Transcribe(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "ظپط§غŒظ„ طµظˆطھغŒ ط§ط±ط³ط§ظ„ ظ†ط´ط¯." });
        }
        if (file.Length > 25 * 1024 * 1024)
        {
            return BadRequest(new { message = "ط­ط¯ط§ع©ط«ط± ط§ظ†ط¯ط§ط²ظ‡ ظپط§غŒظ„ غ²غµ ظ…ع¯ط§ط¨ط§غŒطھ ط§ط³طھ." });
        }
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        try
        {
            var result = await _aiService.TranscribeAsync(ms.ToArray(), file.FileName, file.ContentType ?? "audio/webm");
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = ex.Message });
        }
    }

    [HttpPost("ocr")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<IActionResult> Ocr(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "ظپط§غŒظ„ طھطµظˆغŒط±غŒ ط§ط±ط³ط§ظ„ ظ†ط´ط¯." });
        }
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { message = "ط­ط¯ط§ع©ط«ط± ط§ظ†ط¯ط§ط²ظ‡ طھطµظˆغŒط± غ±غ° ظ…ع¯ط§ط¨ط§غŒطھ ط§ط³طھ." });
        }
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        try
        {
            var result = await _aiService.OcrAsync(ms.ToArray(), file.FileName, file.ContentType ?? "image/jpeg");
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = ex.Message });
        }
    }
}
