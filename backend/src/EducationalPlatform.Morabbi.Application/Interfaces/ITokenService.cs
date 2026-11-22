using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface ITokenService
{
    string CreateToken(MorabbiUser user);
}
