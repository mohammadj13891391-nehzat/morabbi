using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class PointsService : IPointsService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public PointsService(AppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<int> AwardAsync(int userId, string reason, int amount, string? description = null, string? sourceType = null, string? sourceId = null, string? awardedBy = null)
    {
        if (amount == 0) return 0;

        var user = await _db.Users.FindAsync(userId);
        if (user is null) return 0;

        _db.PointTransactions.Add(new PointTransaction
        {
            UserId = userId,
            BranchId = user.BranchId,
            Amount = amount,
            Reason = reason,
            Description = description,
            SourceType = sourceType,
            SourceId = sourceId,
            AwardedBy = awardedBy
        });
        user.TotalPoints += amount;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notificationService.CreateAsync(
            userId,
            "points",
            amount > 0 ? $"+{amount} امتیاز" : $"{amount} امتیاز",
            description);

        return amount;
    }

    public async Task<int> AwardIfNewAsync(int userId, string reason, int amount, string? description, string sourceType, int sourceId, string? awardedBy = null)
    {
        var exists = await _db.PointTransactions
            .AnyAsync(p => p.UserId == userId && p.Reason == reason && p.SourceType == sourceType && p.SourceId == sourceId.ToString());
        if (exists) return 0;
        return await AwardAsync(userId, reason, amount, description, sourceType, sourceId.ToString(), awardedBy);
    }
}
