using System.Security.Cryptography;

namespace EducationalPlatform.Morabbi.Infrastructure.Security;

public static class Hkdf
{
    public static byte[] Extract(byte[] ikm, byte[]? salt)
    {
        using var hmac = new HMACSHA256(salt ?? new byte[32]);
        return hmac.ComputeHash(ikm);
    }

    public static byte[] Expand(byte[] prk, byte[]? info, int outputLength)
    {
        if (prk.Length < 1) throw new CryptographicException("invalid prk");
        if (outputLength < 0 || outputLength > 255 * 32) throw new CryptographicException("invalid output length");
        var result = new byte[outputLength];
        var t = Array.Empty<byte>();
        var offset = 0;
        for (byte i = 1; offset < outputLength; i++)
        {
            var input = new byte[t.Length + (info?.Length ?? 0) + 1];
            Array.Copy(t, 0, input, 0, t.Length);
            if (info is not null)
            {
                Array.Copy(info, 0, input, t.Length, info.Length);
            }
            input[^1] = i;
            using var hmac = new HMACSHA256(prk);
            t = hmac.ComputeHash(input);
            var copy = Math.Min(t.Length, outputLength - offset);
            Array.Copy(t, 0, result, offset, copy);
            offset += copy;
        }
        return result;
    }
}
