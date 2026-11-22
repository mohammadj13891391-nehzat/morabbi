namespace EducationalPlatform.Morabbi.Application.DTOs;

public record PushKeysDto(string P256dh, string Auth);

public record SubscribePushRequest(
    string Endpoint,
    PushKeysDto Keys,
    string? UserAgent = null
);

public record UnsubscribePushRequest(string Endpoint);
