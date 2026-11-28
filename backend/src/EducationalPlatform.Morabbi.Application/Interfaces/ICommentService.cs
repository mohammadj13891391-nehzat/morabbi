using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public record CreateCommentRequest(string TargetType, int TargetId, string Body, string? Anchor, int? ParentId);

public interface ICommentService
{
    Task<List<Comment>> GetByTargetAsync(string targetType, int targetId);
    Task<Comment> CreateAsync(int authorId, CreateCommentRequest request);
    Task DeleteAsync(int id, int actorId, string actorRole);
}
