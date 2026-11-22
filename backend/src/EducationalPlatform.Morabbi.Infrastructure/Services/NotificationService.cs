using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;

    public NotificationService(AppDbContext db, IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _scopeFactory = scopeFactory;
    }

    public async Task<List<Notification>> GetByUserAsync(int userId)
    {
        return await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(100)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAllReadAsync(int userId)
    {
        var unread = await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        foreach (var n in unread)
        {
            n.IsRead = true;
        }
        await _db.SaveChangesAsync();
    }

    public async Task<Notification> CreateAsync(int userId, string type, string title, string? body = null, string? payload = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            Payload = payload
        };
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();
        DispatchPush(userId, type, title, body);
        return notification;
    }

    private void DispatchPush(int userId, string type, string title, string? body)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var push = scope.ServiceProvider.GetRequiredService<IPushSubscriptionService>();
                await push.SendToUserAsync(userId, type, title, body);
            }
            catch
            {
                // web push is best-effort
            }
        });
    }
}
