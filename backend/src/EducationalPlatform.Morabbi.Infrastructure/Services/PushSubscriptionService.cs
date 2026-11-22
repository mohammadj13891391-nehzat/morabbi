using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class PushSubscriptionService : IPushSubscriptionService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PushSubscriptionService> _logger;
    private readonly VapidKeys? _keys;

    public PushSubscriptionService(
        AppDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<PushSubscriptionService> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _keys = BuildKeys(configuration);
    }

    public bool IsEnabled => _keys is not null;

    public string? GetPublicKey() => _keys?.PublicKey;

    public async Task SubscribeAsync(int userId, SubscribePushRequest request)
    {
        ValidateKeys(request.Keys);
        var existing = await _db.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == request.Endpoint);
        if (existing is null)
        {
            _db.PushSubscriptions.Add(new PushSubscription
            {
                UserId = userId,
                Endpoint = request.Endpoint,
                P256dh = request.Keys.P256dh,
                Auth = request.Keys.Auth,
                UserAgent = request.UserAgent
            });
        }
        else
        {
            existing.UserId = userId;
            existing.P256dh = request.Keys.P256dh;
            existing.Auth = request.Keys.Auth;
            existing.UserAgent = request.UserAgent;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    public async Task UnsubscribeAsync(string endpoint)
    {
        var existing = await _db.PushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == endpoint);
        if (existing is not null)
        {
            _db.PushSubscriptions.Remove(existing);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<int> SendToUserAsync(int userId, string type, string title, string? body)
    {
        if (_keys is null) return 0;

        List<PushSubscription> subscriptions;
        try
        {
            subscriptions = await _db.PushSubscriptions.Where(s => s.UserId == userId).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "web push: loading subscriptions failed");
            return 0;
        }
        if (subscriptions.Count == 0) return 0;

        var payload = JsonSerializer.Serialize(new
        {
            title,
            body,
            type,
            tag = type,
            dir = "rtl",
            lang = "fa-IR"
        }, JsonOptions);

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(8);

        var sent = 0;
        foreach (var s in subscriptions)
        {
            int? status;
            try
            {
                status = await WebPushSender.SendAsync(client, _keys, s, payload, _logger);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "web push: send failed for subscription {Id}", s.Id);
                _db.PushSubscriptions.Remove(s);
                await _db.SaveChangesAsync();
                continue;
            }

            if (status is 404 or 410)
            {
                _db.PushSubscriptions.Remove(s);
                await _db.SaveChangesAsync();
                _logger.LogInformation("web push: removed dead subscription {Id}", s.Id);
            }
            else if (status is not null && (int)status < 300)
            {
                sent++;
            }
            else
            {
                _logger.LogWarning("web push: endpoint {Endpoint} returned {Status}", s.Endpoint, status);
            }
        }

        return sent;
    }

    private static void ValidateKeys(PushKeysDto keys)
    {
        byte[] p256dh;
        byte[] auth;
        try
        {
            p256dh = WebPushSender.B64UrlDecode(keys.P256dh);
            auth = WebPushSender.B64UrlDecode(keys.Auth);
        }
        catch (Exception)
        {
            throw new ArgumentException("invalid push keys");
        }
        if (p256dh.Length != 65 || p256dh[0] != 0x04 || auth.Length != 32)
        {
            throw new ArgumentException("invalid push keys");
        }
    }

    private static VapidKeys? BuildKeys(IConfiguration configuration)
    {
        var publicKey = configuration["Push:Vapid:PublicKey"] ?? Environment.GetEnvironmentVariable("MORABBI_PUSH_VAPID_PUBLIC_KEY");
        var privateKey = configuration["Push:Vapid:PrivateKey"] ?? Environment.GetEnvironmentVariable("MORABBI_PUSH_VAPID_PRIVATE_KEY");
        var subject = configuration["Push:Vapid:Subject"] ?? Environment.GetEnvironmentVariable("MORABBI_PUSH_VAPID_SUBJECT") ?? "mailto:admin@nehzat128.ir";
        if (string.IsNullOrWhiteSpace(publicKey) || string.IsNullOrWhiteSpace(privateKey)) return null;
        try
        {
            if (WebPushSender.B64UrlDecode(publicKey).Length != 65) return null;
            if (WebPushSender.B64UrlDecode(privateKey).Length != 32) return null;
            return new VapidKeys(publicKey, privateKey, subject);
        }
        catch
        {
            return null;
        }
    }
}
