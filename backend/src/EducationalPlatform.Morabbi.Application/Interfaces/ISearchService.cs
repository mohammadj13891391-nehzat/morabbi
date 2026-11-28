using EducationalPlatform.Morabbi.Application.DTOs;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public record SearchHit(string Type, int Id, string Title, string? Subtitle, string? Date, string? Status);

public record GlobalSearchResult(List<SearchHit> Reports, List<SearchHit> LessonPlans, List<SearchHit> People, List<SearchHit> QuranVerses, List<SearchHit> Hadiths, List<SearchHit> Tasks);

public interface ISearchService
{
    Task<GlobalSearchResult> SearchAsync(string q, int userId, string role, int? branchId, int perType = 10);
}
