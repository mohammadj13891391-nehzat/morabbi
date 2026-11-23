using EducationalPlatform.Morabbi.Infrastructure.Security;

namespace EducationalPlatform.Morabbi.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void Hash_ThenVerify_ReturnsTrue()
    {
        var stored = PasswordHasher.Hash("password123");
        Assert.True(PasswordHasher.Verify("password123", stored));
    }

    [Fact]
    public void Verify_WrongPassword_ReturnsFalse()
    {
        var stored = PasswordHasher.Hash("password123");
        Assert.False(PasswordHasher.Verify("wrong-password", stored));
    }

    [Fact]
    public void Hash_TwoCalls_ProduceDifferentSalts()
    {
        var a = PasswordHasher.Hash("same");
        var b = PasswordHasher.Hash("same");
        Assert.NotEqual(a, b);
    }

    [Theory]
    [InlineData("garbage")]
    [InlineData("1.abc.def")]
    [InlineData("notanumber.base64==.base64==")]
    public void Verify_MalformedStored_ReturnsFalse(string stored)
    {
        Assert.False(PasswordHasher.Verify("anything", stored));
    }
}
