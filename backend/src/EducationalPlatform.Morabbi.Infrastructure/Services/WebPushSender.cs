using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Security;
using Microsoft.Extensions.Logging;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public sealed record VapidKeys(string PublicKey, string PrivateKey, string Subject);

public static class WebPushSender
{
    public static async Task<int?> SendAsync(HttpClient client, VapidKeys keys, PushSubscription subscription, string payloadJson, ILogger logger)
    {
        var endpointUri = new Uri(subscription.Endpoint);
        var audience = endpointUri.GetLeftPart(UriPartial.Authority);
        var jwt = BuildVapidJwt(keys, audience);

        var salt = RandomNumberGenerator.GetBytes(4);
        var context = new byte[7 + salt.Length];
        Encoding.ASCII.GetBytes("WebPush").CopyTo(context, 0);
        salt.CopyTo(context, 7);

        var ephemeralD = P256.GeneratePrivateKey();
        var (inf, ex, ey) = P256.MulPublic(new BigInteger(ephemeralD, isUnsigned: true, isBigEndian: true), (P256.Gx, P256.Gy));
        if (inf) throw new CryptographicException("ephemeral point at infinity");
        var clientPoint = B64UrlDecode(subscription.P256dh);
        var sharedSecret = P256.SharedSecretX(ephemeralD, clientPoint);

        var prk = Hkdf.Extract(sharedSecret, context);
        var authSecret = Hkdf.Expand(prk, Encoding.ASCII.GetBytes("Content-Non-CE-Keys"), 12);
        var contentEncryptionKey = Hkdf.Expand(prk, Encoding.ASCII.GetBytes("Content-Key"), 16);
        var aesKey = Hkdf.Expand(contentEncryptionKey, Encoding.ASCII.GetBytes("Content-Encoding"), 16);
        var aesIv = Hkdf.Expand(contentEncryptionKey, Encoding.ASCII.GetBytes("Content-IV"), 12);

        var payloadBytes = Encoding.UTF8.GetBytes(payloadJson);
        var record = new byte[2 + payloadBytes.Length];
        record[0] = (byte)(payloadBytes.Length >> 8);
        record[1] = (byte)(payloadBytes.Length & 0xFF);
        payloadBytes.CopyTo(record, 2);

        var plaintext = new byte[authSecret.Length + record.Length];
        authSecret.CopyTo(plaintext, 0);
        record.CopyTo(plaintext, authSecret.Length);

        var encrypted = new byte[plaintext.Length];
        var tag = new byte[16];
        using (var aes = new AesGcm(aesKey, 16))
        {
            aes.Encrypt(aesIv, plaintext, encrypted, tag, context);
        }
        var ciphertext = new byte[encrypted.Length + tag.Length];
        encrypted.CopyTo(ciphertext, 0);
        tag.CopyTo(ciphertext, encrypted.Length);

        var p256dh = new byte[65];
        p256dh[0] = 0x04;
        Buffer.BlockCopy(P256.To32(ex), 0, p256dh, 1, 32);
        Buffer.BlockCopy(P256.To32(ey), 0, p256dh, 33, 32);

        using var request = new HttpRequestMessage(HttpMethod.Post, subscription.Endpoint);
        request.Headers.Add("Authorization", $"WebPush {B64Url(Encoding.ASCII.GetBytes(jwt))}");
        request.Headers.Add("Crypto-Key", $"p256dh={B64Url(p256dh)}; vapidkey={keys.PublicKey}");
        request.Headers.Add("TTL", "60");
        request.Content = new ByteArrayContent(ciphertext);
        request.Content.Headers.TryAddWithoutValidation("Content-Encoding", "aes128gcm");

        try
        {
            using var response = await client.SendAsync(request);
            return (int)response.StatusCode;
        }
        catch (Exception)
        {
            logger.LogWarning("web push: no response from {Endpoint}", subscription.Endpoint);
            return null;
        }
    }

    public static string B64Url(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    public static byte[] B64UrlDecode(string value)
    {
        var b64 = value.Replace('-', '+').Replace('_', '/');
        b64 = b64.PadRight(b64.Length + ((4 - b64.Length % 4) % 4), '=');
        return Convert.FromBase64String(b64);
    }

    private static string BuildVapidJwt(VapidKeys keys, string audience)
    {
        var header = JsonSerializer.Serialize(new { typ = "JWT", alg = "ES256" });
        var sub = B64Url(Encoding.UTF8.GetBytes(keys.Subject));
        var claims = new
        {
            iss = keys.Subject,
            sub,
            aud = audience,
            exp = (int)DateTimeOffset.UtcNow.AddHours(6).ToUnixTimeSeconds()
        };
        var payload = JsonSerializer.Serialize(claims);
        var signingInput = $"{B64Url(Encoding.UTF8.GetBytes(header))}.{B64Url(Encoding.UTF8.GetBytes(payload))}";

        var digest = SHA256.HashData(Encoding.UTF8.GetBytes(signingInput));
        var signature = P256.EcdsaSign(digest, B64UrlDecode(keys.PrivateKey));
        return $"{signingInput}.{B64Url(signature)}";
    }
}
