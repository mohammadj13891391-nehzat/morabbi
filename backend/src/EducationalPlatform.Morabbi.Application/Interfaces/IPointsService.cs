namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IPointsService
{
    Task<int> AwardAsync(int userId, string reason, int amount, string? description = null, string? sourceType = null, string? sourceId = null, string? awardedBy = null);

    Task<int> AwardIfNewAsync(int userId, string reason, int amount, string? description, string sourceType, int sourceId, string? awardedBy = null);
}
