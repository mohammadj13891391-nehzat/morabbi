using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IRecognitionService
{
    Task<object> GetBoardAsync(int? branchId);
    Task<Recognition> AwardAsync(int awardedById, AwardRecognitionRequest request);
    Task<List<Recognition>> GetRecognitionsAsync(int? userId);
    Task<List<PointTransaction>> GetPointTransactionsAsync(int userId);
}
