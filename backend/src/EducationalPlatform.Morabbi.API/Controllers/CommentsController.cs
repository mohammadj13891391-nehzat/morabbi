using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/comments")]
public class CommentsController : MorabbiControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(IMorabbiUserService userService, ICommentService commentService)
        : base(userService)
    {
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetByTarget([FromQuery] string targetType, [FromQuery] int targetId)
    {
        return Ok(await _commentService.GetByTargetAsync(targetType, targetId));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        try
        {
            var comment = await _commentService.CreateAsync(current.Id, request);
            return Ok(new { comment });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        try
        {
            await _commentService.DeleteAsync(id, current.Id, current.Role);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}
