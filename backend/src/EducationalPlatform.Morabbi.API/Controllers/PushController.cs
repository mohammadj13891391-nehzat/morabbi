using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/push")]
public class PushController : MorabbiControllerBase
{
    private readonly IPushSubscriptionService _push;

    public PushController(IMorabbiUserService userService, IPushSubscriptionService push)
        : base(userService)
    {
        _push = push;
    }

    [HttpGet("public-key")]
    public IActionResult GetPublicKey()
    {
        return Ok(new { publicKey = _push.GetPublicKey() });
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribePushRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        try
        {
            await _push.SubscribeAsync(current.Id, request);
        }
        catch (ArgumentException)
        {
            return BadRequest(new { message = "کلیدهای اشتراک اعلان نامعتبر است." });
        }
        return Ok(new { message = "اشتراک اعلان‌ها ثبت شد." });
    }

    [HttpDelete("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribePushRequest request)
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        await _push.UnsubscribeAsync(request.Endpoint);
        return Ok(new { message = "اشتراک اعلان‌ها حذف شد." });
    }

    [HttpPost("test")]
    public async Task<IActionResult> Test()
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        if (!_push.IsEnabled)
        {
            return Ok(new { sent = 0, enabled = false });
        }
        var sent = await _push.SendToUserAsync(current.Id, "test", "تست اعلان", "این یک پیام آزمایشی از سامانه مربی است.");
        return Ok(new { sent, enabled = true });
    }
}
