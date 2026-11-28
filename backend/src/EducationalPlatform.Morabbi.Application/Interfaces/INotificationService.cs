using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface INotificationService
{
    Task<List<Notification>> GetByUserAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAllReadAsync(int userId);
    Task<Notification> CreateAsync(int userId, string type, string title, string? body = null, string? payload = null);
}
