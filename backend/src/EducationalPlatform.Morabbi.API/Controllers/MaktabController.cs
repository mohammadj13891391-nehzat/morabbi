using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/maktabs")]
public class MaktabController : MorabbiControllerBase
{
    private readonly IMaktabService _maktabService;

    public MaktabController(IMorabbiUserService userService, IMaktabService maktabService)
        : base(userService)
    {
        _maktabService = maktabService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _maktabService.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var maktab = await _maktabService.FindByIdAsync(id);
        if (maktab is null)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        return Ok(maktab);
    }

    [HttpPost]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> Create([FromBody] CreateMaktabRequest request)
    {
        try
        {
            return Ok(await _maktabService.CreateAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMaktabRequest request)
    {
        try
        {
            return Ok(await _maktabService.UpdateAsync(id, request));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _maktabService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
