using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : MorabbiControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(IMorabbiUserService userService, INotificationService notificationService)
        : base(userService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        var notifications = await _notificationService.GetByUserAsync(current.Id);
        var unreadCount = await _notificationService.GetUnreadCountAsync(current.Id);
        return Ok(new { notifications, unreadCount });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var current = await GetCurrentUserAsync();
        if (current is null)
        {
            return Unauthorized(GenericErrorMessages.Unauthorized);
        }
        await _notificationService.MarkAllReadAsync(current.Id);
        return Ok(new { message = "اعلان‌ها خوانده شدند." });
    }
}
