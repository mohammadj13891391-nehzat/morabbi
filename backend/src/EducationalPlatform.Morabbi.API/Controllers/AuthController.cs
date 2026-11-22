using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : MorabbiControllerBase
{
    public AuthController(IMorabbiUserService userService) : base(userService) { }

    [HttpPost("local")]
    [AllowAnonymous]
    public async Task<IActionResult> LocalLogin([FromBody] LocalLoginRequest request)
    {
        var result = await _userService.LocalLoginAsync(request.Phone, request.Password);
        if (result is null)
        {
            return Unauthorized(GenericErrorMessages.LoginFailed);
        }
        return Ok(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _userService.RegisterAsync(request);
            return Ok(new { message = "ثبت‌نام شما با موفقیت انجام شد و در انتظار تأیید مسئول است.", user });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        return Ok(await _userService.FindByIdAsync(user.Id));
    }

    [HttpGet("pending-approvals")]
    [Authorize(Roles = "admin,manager,branch_manager")]
    public async Task<IActionResult> PendingApprovals()
    {
        return Ok(await _userService.GetPendingApprovalsAsync());
    }

    [HttpPost("approve")]
    [Authorize(Roles = "admin,manager,branch_manager")]
    public async Task<IActionResult> Approve([FromBody] ApproveUserRequest request)
    {
        var current = await GetCurrentUserAsync();
        try
        {
            var user = await _userService.ApproveUserAsync(request.UserId, request.Approved, current?.Name ?? "system");
            return Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(GenericErrorMessages.NotFound);
        }
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            await _userService.ChangePasswordAsync(current.Id, request.OldPassword, request.NewPassword);
            return Ok(new { message = "رمز عبور با موفقیت تغییر کرد." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
