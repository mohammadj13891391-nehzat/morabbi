using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/books")]
public class BooksController : MorabbiControllerBase
{
    private readonly IBookService _bookService;

    public BooksController(IMorabbiUserService userService, IBookService bookService)
        : base(userService)
    {
        _bookService = bookService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] string? loop)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        if (!IsStaff && string.IsNullOrWhiteSpace(loop))
        {
            loop = current.TrainingLoop;
        }
        return Ok(await _bookService.SearchAsync(q, loop));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            return Ok(await _bookService.GetAsync(id));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin,manager,branch_manager")]
    public async Task<IActionResult> Create([FromBody] CreateBookRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(GenericErrorMessages.Validation);
        }
        var created = await _bookService.CreateAsync(request);
        return Ok(ToDetail(created));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,manager,branch_manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBookRequest request)
    {
        try
        {
            var updated = await _bookService.UpdateAsync(id, request);
            return Ok(ToDetail(updated));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _bookService.DeleteAsync(id);
            return Ok(new { ok = true });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpGet("users")]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> GetUsers()
    {
        return Ok(await _userService.GetAllAsync());
    }

    [HttpPut("users/{userId:int}/loop")]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> SetUserLoop(int userId, [FromBody] SetUserLoopRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Loop))
        {
            return BadRequest(GenericErrorMessages.Validation);
        }
        try
        {
            await _bookService.SetUserLoopAsync(userId, request.Loop);
            return Ok(new { ok = true });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private static BookDetailDto ToDetail(Book b) => new(
        b.Id, b.Title, b.Author, b.Category, b.Description, b.Content, b.GetLoops(), b.IsActive);
}
