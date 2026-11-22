using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace EducationalPlatform.Morabbi.API.Middleware;

public class MorabbiSyncMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<MorabbiSyncMiddleware> _logger;

    public MorabbiSyncMiddleware(RequestDelegate next, ILogger<MorabbiSyncMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IServiceProvider services)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sub = context.User.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(sub))
            {
                var scope = services.CreateScope();
                try
                {
                    var userService = scope.ServiceProvider.GetRequiredService<IMorabbiUserService>();
                    var user = await userService.FindByPhoneAsync(sub)
                        ?? await userService.FindByOidcSubjectAsync(sub);

                    if (user is null)
                    {
                        var role = context.User.FindAll("role").FirstOrDefault()?.Value ?? "coach";
                        user = await userService.CreateFromOidcAsync(sub, role);
                        _logger.LogInformation("👤 کاربر جدید از OTUH2 ایجاد شد: {Subject}", sub);
                    }

                    var tokenRole = context.User.FindAll("role").FirstOrDefault()?.Value;
                    if (tokenRole is not null && user.Role != tokenRole)
                    {
                        await userService.UpdateRoleFromClaimsAsync(user.Id, tokenRole);
                    }

                    context.Items["MorabbiUserId"] = user.Id;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("⚠️ خطا در همگام‌سازی کاربر: {Message}", ex.Message);
                }
                finally
                {
                    scope.Dispose();
                }
            }
        }

        await _next(context);
    }
}
