using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class CommentService : ICommentService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public CommentService(AppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<List<Comment>> GetByTargetAsync(string targetType, int targetId)
    {
        return await _db.Comments
            .Include(c => c.Author)
            .Where(c => c.TargetType == targetType && c.TargetId == targetId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Comment> CreateAsync(int authorId, CreateCommentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Body))
        {
            throw new InvalidOperationException("متن کامنت الزامی است.");
        }
        var comment = new Comment
        {
            TargetType = request.TargetType,
            TargetId = request.TargetId,
            AuthorId = authorId,
            Body = request.Body.Trim(),
            Anchor = request.Anchor,
            ParentId = request.ParentId
        };
        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        var notified = await ResolveNotifyTargetAsync(comment);
        if (notified is not null && notified != authorId)
        {
            await _notificationService.CreateAsync(
                notified.Value, "comment",
                "کامنت جدید دریافت کردید",
                Truncate(request.Body, 150));
        }

        return await _db.Comments
            .Include(c => c.Author)
            .FirstAsync(c => c.Id == comment.Id);
    }

    public async Task DeleteAsync(int id, int actorId, string actorRole)
    {
        var comment = await _db.Comments.FindAsync(id)
            ?? throw new KeyNotFoundException("Comment not found");
        var isStaff = actorRole is "admin" or "manager" or "branch_manager";
        if (comment.AuthorId != actorId && !isStaff)
        {
            throw new UnauthorizedAccessException("دسترسی برای حذف کامنت ندارید.");
        }
        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync();
    }

    private async Task<int?> ResolveNotifyTargetAsync(Comment comment)
    {
        if (comment.ParentId is not null)
        {
            var parent = await _db.Comments.FindAsync(comment.ParentId.Value);
            if (parent is not null) return parent.AuthorId;
        }
        if (comment.TargetType == "report")
        {
            return (await _db.DailyReports.FindAsync(comment.TargetId))?.InstructorId;
        }
        if (comment.TargetType == "lesson_plan")
        {
            return (await _db.LessonPlans.FindAsync(comment.TargetId))?.InstructorId;
        }
        return null;
    }

    private static string Truncate(string text, int max)
    {
        return text.Length <= max ? text : text[..max] + "…";
    }
}
