using EducationalPlatform.Morabbi.Application.DTOs;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IPushSubscriptionService
{
    bool IsEnabled { get; }

    string? GetPublicKey();

    Task SubscribeAsync(int userId, SubscribePushRequest request);

    Task UnsubscribeAsync(string endpoint);

    Task<int> SendToUserAsync(int userId, string type, string title, string? body);
}
