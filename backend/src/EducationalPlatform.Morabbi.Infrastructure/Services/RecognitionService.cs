using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class RecognitionService : IRecognitionService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public RecognitionService(AppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<object> GetBoardAsync(int? branchId)
    {
        var query = _db.Users
            .Include(u => u.Branch)
            .Where(u => u.Active && u.ApprovalStatus == "approved")
            .AsQueryable();
        if (branchId.HasValue)
        {
            query = query.Where(u => u.BranchId == branchId);
        }
        var board = await query
            .OrderByDescending(u => u.TotalPoints)
            .ThenBy(u => u.RecognitionsCount)
            .Take(50)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Role,
                u.BranchId,
                BranchName = u.Branch != null ? u.Branch.Name : "",
                u.TotalPoints,
                u.RecognitionsCount
            })
            .ToListAsync();
        return board;
    }

    public async Task<Recognition> AwardAsync(int awardedById, AwardRecognitionRequest request)
    {
        var target = await _db.Users.FindAsync(request.UserId)
            ?? throw new KeyNotFoundException("User not found");
        var awardedBy = await _db.Users.FindAsync(awardedById)
            ?? throw new KeyNotFoundException("User not found");

        var recognition = new Recognition
        {
            UserId = target.Id,
            BranchId = target.BranchId,
            Level = request.Level,
            Title = request.Title,
            Description = request.Description,
            Period = request.Period,
            AwardedBy = awardedBy.Name
        };
        _db.Recognitions.Add(recognition);

        if (request.Points != 0)
        {
            _db.PointTransactions.Add(new PointTransaction
            {
                UserId = target.Id,
                BranchId = target.BranchId,
                Amount = request.Points,
                Reason = "RECOGNITION_BONUS",
                Description = request.Title,
                SourceType = "recognition",
                AwardedBy = awardedBy.Name
            });
            target.TotalPoints += request.Points;
        }
        target.RecognitionsCount += 1;
        target.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notificationService.CreateAsync(target.Id, "recognition",
            "تقدیر برای شما ثبت شد", request.Title);

        return await _db.Recognitions
            .Include(r => r.User)
            .Include(r => r.Branch)
            .FirstAsync(r => r.Id == recognition.Id);
    }

    public async Task<List<Recognition>> GetRecognitionsAsync(int? userId)
    {
        var query = _db.Recognitions
            .Include(r => r.User)
            .Include(r => r.Branch)
            .AsQueryable();
        if (userId.HasValue)
        {
            query = query.Where(r => r.UserId == userId);
        }
        return await query.OrderByDescending(r => r.CreatedAt).Take(200).ToListAsync();
    }

    public async Task<List<PointTransaction>> GetPointTransactionsAsync(int userId)
    {
        return await _db.PointTransactions
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Take(200)
            .ToListAsync();
    }
}
