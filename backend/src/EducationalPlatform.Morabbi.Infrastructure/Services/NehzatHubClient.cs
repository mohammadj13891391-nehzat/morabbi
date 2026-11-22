using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public interface INehzatHubClient
{
    bool IsEnabled { get; }

    Task NotifyAsync(string phone, string type, string title, string body, string? link = null);
}

public sealed class NehzatHubClient : INehzatHubClient
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<NehzatHubClient> _logger;

    public NehzatHubClient(IHttpClientFactory httpFactory, IConfiguration config, ILogger<NehzatHubClient> logger)
    {
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    public bool IsEnabled =>
        _config.GetValue("NehzatHub:Enabled", false)
        && !string.IsNullOrWhiteSpace(_config["NehzatHub:BaseUrl"])
        && !string.IsNullOrWhiteSpace(_config["NehzatHub:Key"]);

    public async Task NotifyAsync(string phone, string type, string title, string body, string? link = null)
    {
        if (!IsEnabled || string.IsNullOrWhiteSpace(phone))
        {
            return;
        }

        try
        {
            var client = _httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var url = $"{_config["NehzatHub:BaseUrl"].TrimEnd('/')}/api/internal/notifications";
            var payload = new { phone, type, title, body, link };

            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent.Create(payload)
            };
            request.Headers.Add("X-Internal-Key", _config["NehzatHub:Key"]);

            using var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Nehzat hub notify failed ({Status}) for {Phone}", (int)response.StatusCode, phone);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Nehzat hub notify failed for {Phone}", phone);
        }
    }
}
