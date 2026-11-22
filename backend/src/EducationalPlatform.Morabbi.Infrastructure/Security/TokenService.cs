using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EducationalPlatform.Morabbi.Infrastructure.Security;

public class TokenService : ITokenService
{
    private readonly SymmetricSecurityKey _key;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _lifetimeMinutes;

    public TokenService(IConfiguration configuration)
    {
        var localAuth = configuration.GetSection("LocalAuth");
        var secret = localAuth["Secret"]
            ?? Environment.GetEnvironmentVariable("MORABBI_LOCAL_AUTH_SECRET")
            ?? throw new InvalidOperationException("LocalAuth:Secret (or MORABBI_LOCAL_AUTH_SECRET env var) is required");
        _issuer = localAuth["Issuer"] ?? "http://localhost:3010";
        _audience = localAuth["Audience"] ?? _issuer;
        _lifetimeMinutes = int.TryParse(localAuth["TokenLifetimeMinutes"], out var minutes) ? minutes : 60;
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    public string CreateToken(MorabbiUser user)
    {
        var now = DateTimeOffset.UtcNow;
        var claims = new List<Claim>
        {
            new Claim("sub", user.OidcSubject ?? user.Phone),
            new Claim("userId", user.Id.ToString()),
            new Claim("role", user.Role),
            new Claim("exp", (now.ToUnixTimeSeconds() + _lifetimeMinutes * 60L).ToString(), ClaimValueTypes.Integer64),
            new Claim("iat", now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };
        if (user.BranchId.HasValue) claims.Add(new Claim("branchId", user.BranchId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: now.UtcDateTime.AddMinutes(_lifetimeMinutes),
            signingCredentials: new SigningCredentials(_key, SecurityAlgorithms.HmacSha256));

        token.Header["typ"] = "at+jwt";
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
