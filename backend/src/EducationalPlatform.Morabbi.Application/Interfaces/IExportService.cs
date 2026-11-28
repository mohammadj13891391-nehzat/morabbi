namespace EducationalPlatform.Morabbi.Application.Interfaces;

public record ExportFile(byte[] Content, string FileName, string ContentType);

public interface IExportService
{
    Task<ExportFile> GetCsvAsync(string type, int? userId, string? role, int? branchId);
    Task<ExportFile> GetReportPdfAsync(int reportId);
    Task<ExportFile> GetLessonPlanPdfAsync(int planId);
    Task<ExportFile> GetMonthlyPdfAsync(int year, int month, int? branchId, bool isStaff);
}
