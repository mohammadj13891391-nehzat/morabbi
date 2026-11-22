using System.Numerics;
using System.Security.Cryptography;

namespace EducationalPlatform.Morabbi.Infrastructure.Security;

public static class P256
{
    public static readonly BigInteger P = FromHex("FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF");
    public static readonly BigInteger B = FromHex("5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B");
    public static readonly BigInteger N = FromHex("FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551");
    public static readonly BigInteger Gx = FromHex("6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296");
    public static readonly BigInteger Gy = FromHex("4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5");

    static BigInteger FromHex(string hex) => new BigInteger(Convert.FromHexString(hex), isUnsigned: true, isBigEndian: true);

    static BigInteger Mod(BigInteger x) { x %= P; if (x < 0) x += P; return x; }
    static BigInteger ModN(BigInteger x) { x %= N; if (x < 0) x += N; return x; }

    public static BigInteger ModInvPublic(BigInteger a)
    {
        a = Mod(a);
        BigInteger oldR = a, r = P;
        BigInteger oldS = BigInteger.One, s = BigInteger.Zero;
        while (r != 0) { var q = oldR / r; (oldR, r) = (r, oldR - q * r); (oldS, s) = (s, oldS - q * s); }
        return Mod(oldS);
    }

    static BigInteger ModInvN(BigInteger a)
    {
        a = ModN(a);
        BigInteger oldR = a, r = N;
        BigInteger oldS = BigInteger.One, s = BigInteger.Zero;
        while (r != 0) { var q = oldR / r; (oldR, r) = (r, oldR - q * r); (oldS, s) = (s, oldS - q * s); }
        return ModN(oldS);
    }

    public static bool IsOnCurve(BigInteger x, BigInteger y)
        => Mod(y * y) == Mod(x * x * x - 3 * x + B);

    static (bool Inf, BigInteger X, BigInteger Y) AAdd((bool Inf, BigInteger X, BigInteger Y) a, (bool Inf, BigInteger X, BigInteger Y) b)
    {
        if (a.Inf) return b;
        if (b.Inf) return a;
        if (a.X == b.X)
        {
            if (Mod(a.Y + b.Y).IsZero) return (true, BigInteger.Zero, BigInteger.Zero);
            return ADouble(a);
        }
        var m = Mod((b.Y - a.Y) * ModInvPublic(b.X - a.X));
        var x3 = Mod(m * m - a.X - b.X);
        var y3 = Mod(m * (a.X - x3) - a.Y);
        return (false, x3, y3);
    }

    static (bool Inf, BigInteger X, BigInteger Y) ADouble((bool Inf, BigInteger X, BigInteger Y) a)
    {
        if (a.Inf || a.Y.IsZero) return (true, BigInteger.Zero, BigInteger.Zero);
        var m = Mod((3 * a.X * a.X - 3) * ModInvPublic(2 * a.Y));
        var x3 = Mod(m * m - 2 * a.X);
        var y3 = Mod(m * (a.X - x3) - a.Y);
        return (false, x3, y3);
    }

    public static (bool Inf, BigInteger X, BigInteger Y) MulPublic(BigInteger k, (BigInteger X, BigInteger Y) point)
    {
        k = ModN(k);
        var result = (true, BigInteger.Zero, BigInteger.Zero);
        for (long bit = k.GetBitLength() - 1; bit >= 0; bit--)
        {
            result = ADouble(result);
            if (((k >> (int)bit) & 1) != 0)
                result = AAdd(result, (false, point.X, point.Y));
        }
        return result;
    }

    static (BigInteger X, BigInteger Y) From65(byte[] p65)
    {
        if (p65.Length != 65 || p65[0] != 4) throw new ArgumentException("bad point", nameof(p65));
        var x = new BigInteger(p65.AsSpan(1, 32).ToArray(), isUnsigned: true, isBigEndian: true);
        var y = new BigInteger(p65.AsSpan(33, 32).ToArray(), isUnsigned: true, isBigEndian: true);
        return (x, y);
    }

    public static (bool Inf, BigInteger X, BigInteger Y) SharedPoint(byte[] dBytes, byte[] q65)
    {
        var d = new BigInteger(dBytes, isUnsigned: true, isBigEndian: true);
        var (qx, qy) = From65(q65);
        return MulPublic(d, (qx, qy));
    }

    public static byte[] SharedSecretX(byte[] d, byte[] q65)
    {
        var r = SharedPoint(d, q65);
        if (r.Inf) throw new CryptographicException("shared point at infinity");
        return To32(r.X);
    }

    public static byte[] EcdsaSign(byte[] sha256Digest, byte[] privD32)
    {
        var d = new BigInteger(privD32, isUnsigned: true, isBigEndian: true);
        var e = new BigInteger(sha256Digest, isUnsigned: true, isBigEndian: true);
        var rnd = RandomNumberGenerator.Create();
        while (true)
        {
            var kBytes = new byte[32];
            rnd.GetBytes(kBytes);
            var k = new BigInteger(kBytes, isUnsigned: true, isBigEndian: true);
            if (k.IsZero || k >= N) continue;
            var rPt = MulPublic(k, (Gx, Gy));
            if (rPt.Inf) continue;
            var r = ModN(rPt.X);
            if (r.IsZero) continue;
            var s = ModN(ModInvN(k) * (e + r * d));
            if (s.IsZero) continue;
            var sig = new byte[64];
            Array.Copy(To32(r), 0, sig, 0, 32);
            Array.Copy(To32(s), 0, sig, 32, 32);
            return sig;
        }
    }

    public static byte[] To32(BigInteger v)
    {
        v = Mod(v);
        var bytes = v.ToByteArray(isUnsigned: true, isBigEndian: true);
        var outb = new byte[32];
        var copy = Math.Min(bytes.Length, 32);
        Array.Copy(bytes, bytes.Length - copy, outb, 32 - copy, copy);
        return outb;
    }

    public static byte[] GeneratePrivateKey()
    {
        var rnd = RandomNumberGenerator.Create();
        while (true)
        {
            var bytes = new byte[32];
            rnd.GetBytes(bytes);
            var d = new BigInteger(bytes, isUnsigned: true, isBigEndian: true);
            if (d.IsZero || d >= N) continue;
            return bytes;
        }
    }
}
