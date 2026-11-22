using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/branches")]
public class BranchController : MorabbiControllerBase
{
    private readonly IBranchService _branchService;

    public BranchController(IMorabbiUserService userService, IBranchService branchService)
        : base(userService)
    {
        _branchService = branchService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _branchService.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var branch = await _branchService.FindByIdAsync(id);
        if (branch is null)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
        return Ok(branch);
    }

    [HttpPost]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> Create([FromBody] CreateBranchRequest request)
    {
        try
        {
            return Ok(await _branchService.CreateAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBranchRequest request)
    {
        try
        {
            return Ok(await _branchService.UpdateAsync(id, request));
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
            await _branchService.DeleteAsync(id);
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
