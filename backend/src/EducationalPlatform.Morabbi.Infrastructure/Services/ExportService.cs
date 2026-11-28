using System.Globalization;
using System.Text;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class ExportService : IExportService
{
    private static readonly PersianCalendar Persian = new();
    private static readonly CultureInfo Fa = CultureInfo.GetCultureInfo("fa-IR");
    private static bool _fontConfigured;

    private readonly AppDbContext _db;
    private readonly ILogger<ExportService> _logger;

    public ExportService(AppDbContext db, ILogger<ExportService> logger)
    {
        _db = db;
        _logger = logger;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private static string FontFamily
    {
        get
        {
            EnsureFont();
            return FontPath() is not null ? "morabbi" : "Helvetica";
        }
    }

    private static void EnsureFont()
    {
        if (_fontConfigured) return;
        _fontConfigured = true;
        var path = FontPath();
        if (path is null) return;
        try
        {
            using var stream = File.OpenRead(path);
            FontManager.RegisterFontWithCustomName("morabbi", stream);
        }
        catch (Exception ex)
        {
            _loggerStatic?.LogWarning(ex, "Failed to register Persian font for PDF");
        }
    }

    private static ILogger? _loggerStatic;

    private static string? FontPath()
    {
        return new[]
        {
            Environment.GetEnvironmentVariable("MORABBI_PDF_FONT"),
            Path.Combine(AppContext.BaseDirectory, "Fonts", "Vazirmatn-Regular.ttf"),
            @"C:\Windows\Fonts\tahoma.ttf",
            @"C:\Windows\Fonts\Tahoma.ttf"
        }.Where(p => !string.IsNullOrWhiteSpace(p) && File.Exists(p)).FirstOrDefault();
    }

    // ===== CSV =====

    public async Task<ExportFile> GetCsvAsync(string type, int? userId, string? role, int? branchId)
    {
        _loggerStatic ??= _logger;
        var (csv, filename) = type switch
        {
            "evaluations" => (await BuildEvaluationsCsvAsync(), "evaluations-export.csv"),
            "recognitions" => (await BuildRecognitionsCsvAsync(), "recognitions-export.csv"),
            _ => (await BuildReportsCsvAsync(userId, role, branchId), "reports-export.csv")
        };
        var bytes = new byte[] { 0xEF, 0xBB, 0xBF };
        return new ExportFile(
            bytes.Concat(Encoding.UTF8.GetBytes(csv)).ToArray(),
            filename,
            "text/csv; charset=utf-8");
    }

    private async Task<string> BuildReportsCsvAsync(int? userId, string? role, int? branchId)
    {
        List<DailyReport> reports;
        if (role is "coach" or "instructor_assistant" && userId is not null)
        {
            reports = await _db.DailyReports
                .Include(r => r.Instructor).Include(r => r.Branch)
                .Where(r => r.InstructorId == userId)
                .OrderByDescending(r => r.CreatedAt).Take(500).ToListAsync();
        }
        else if (role == "branch_manager" && branchId is not null)
        {
            reports = await _db.DailyReports
                .Include(r => r.Instructor).Include(r => r.Branch)
                .Where(r => r.BranchId == branchId)
                .OrderByDescending(r => r.CreatedAt).Take(500).ToListAsync();
        }
        else
        {
            reports = await _db.DailyReports
                .Include(r => r.Instructor).Include(r => r.Branch)
                .OrderByDescending(r => r.CreatedAt).Take(500).ToListAsync();
        }

        var sb = new StringBuilder();
        sb.AppendLine("ردیف,عنوان,مربی,شعبه,تاریخ,وضعیت");
        for (int i = 0; i < reports.Count; i++)
        {
            var r = reports[i];
            sb.AppendLine($"{i + 1},{Csv(r.Subject)},{Csv(r.Instructor?.Name)},{Csv(r.Branch?.Name)},{ToPersianDate(r.Date)},{Csv(r.Status)}");
        }
        return sb.ToString();
    }

    private async Task<string> BuildEvaluationsCsvAsync()
    {
        var evaluations = await _db.Evaluations
            .Include(e => e.Evaluator)
            .OrderByDescending(e => e.CreatedAt).Take(500).ToListAsync();
        var sb = new StringBuilder();
        sb.AppendLine("ردیف,نوع,شناسه هدف,ارزیاب,توضیح,وضعیت,تاریخ");
        for (int i = 0; i < evaluations.Count; i++)
        {
            var e = evaluations[i];
            sb.AppendLine($"{i + 1},{Csv(e.TargetType)},{e.TargetId},{Csv(e.Evaluator?.Name)},{Csv(e.OverallComment)},{Csv(e.Status)},{ToPersianDate(e.CreatedAt)}");
        }
        return sb.ToString();
    }

    private async Task<string> BuildRecognitionsCsvAsync()
    {
        var recognitions = await _db.Recognitions
            .Include(r => r.User).Include(r => r.Branch)
            .OrderByDescending(r => r.CreatedAt).Take(500).ToListAsync();
        var sb = new StringBuilder();
        sb.AppendLine("ردیف,نام,شعبه,سطح,عنوان,توضیح,دوره,اعطاکننده,تاریخ");
        for (int i = 0; i < recognitions.Count; i++)
        {
            var r = recognitions[i];
            sb.AppendLine($"{i + 1},{Csv(r.User?.Name)},{Csv(r.Branch?.Name)},{Csv(r.Level)},{Csv(r.Title)},{Csv(r.Description)},{Csv(r.Period)},{Csv(r.AwardedBy)},{ToPersianDate(r.CreatedAt)}");
        }
        return sb.ToString();
    }

    private static string Csv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        var v = value.Replace("\r", " ").Replace("\n", " ").Replace("\"", "\"\"");
        return $"\"{v}\"";
    }

    private static string ToPersianDate(DateTime dt)
    {
        var d = dt.Kind == DateTimeKind.Utc ? dt.ToLocalTime() : dt;
        var y = Persian.GetYear(d);
        var m = Persian.GetMonth(d);
        var day = Persian.GetDayOfMonth(d);
        return $"{y}/{m:00}/{day:00}";
    }

    private static string PersianMonthName(int month)
    {
        try
        {
            return Fa.DateTimeFormat.MonthNames[month - 1] ?? $"ماه {month}";
        }
        catch
        {
            return $"ماه {month}";
        }
    }

    private static DateTime PersianMonthStart(int year, int month)
    {
        return Persian.ToDateTime(year, month, 1, 0, 0, 0, 0, 0);
    }

    // ===== PDF =====

    public async Task<ExportFile> GetReportPdfAsync(int reportId)
    {
        var report = await _db.DailyReports
            .Include(r => r.Instructor).Include(r => r.Branch)
            .FirstOrDefaultAsync(r => r.Id == reportId)
            ?? throw new KeyNotFoundException("Report not found");

        var ff = FontFamily;
        var pdf = Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(25, Unit.Millimetre);
                page.Header().Column(col =>
                {
                    col.Item().AlignRight().Text("گزارش روزانه — سامانه مربی").FontSize(10).FontFamily(ff).FontColor(Colors.Grey.Darken1);
                    col.Item().AlignRight().Text($"تاریخ: {ToPersianDate(report.Date)}").FontSize(9).FontFamily(ff);
                });
                page.Content().Column(col =>
                {
                    col.Item().AlignRight().Text(report.Subject).FontSize(18).Bold().FontFamily(ff);
                    MetaRow(col, "مربی", report.Instructor?.Name, ff);
                    MetaRow(col, "شعبه", report.Branch?.Name, ff);
                    MetaRow(col, "وضعیت", report.Status, ff);
                    MetaRow(col, "مخاطب", report.Audience, ff);
                    Section(col, "چکیده", report.Summary, ff);
                    Section(col, "بدنه گزارش", report.Content, ff);
                    Section(col, "توصیه‌ها و پیشنهادات", report.Recommendations, ff);
                    Section(col, "چالش‌ها", report.Challenges, ff);
                    Section(col, "راهکارها", report.Solutions, ff);
                    Section(col, "ملاحظات تربیتی", report.PedagogicalNotes, ff);
                    Section(col, "خودارزیابی", report.EvaluationSelf, ff);
                    Section(col, "نتیجه ارزیاب", report.EvaluationResult, ff);
                });
                PageFooter(page, ff);
            });
        }).GeneratePdf();

        return new ExportFile(pdf, $"report-{reportId}.pdf", "application/pdf");
    }

    public async Task<ExportFile> GetLessonPlanPdfAsync(int planId)
    {
        var plan = await _db.LessonPlans
            .Include(p => p.Instructor).Include(p => p.Branch)
            .FirstOrDefaultAsync(p => p.Id == planId)
            ?? throw new KeyNotFoundException("Lesson plan not found");

        var ff = FontFamily;
        var pdf = Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(25, Unit.Millimetre);
                page.Header().Column(col =>
                {
                    col.Item().AlignRight().Text("طرح درس — سامانه مربی").FontSize(10).FontFamily(ff).FontColor(Colors.Grey.Darken1);
                    col.Item().AlignRight().Text($"تاریخ: {ToPersianDate(plan.CreatedAt)}").FontSize(9).FontFamily(ff);
                });
                page.Content().Column(col =>
                {
                    col.Item().AlignRight().Text(plan.Title).FontSize(18).Bold().FontFamily(ff);
                    MetaRow(col, "موضوع", plan.Subject, ff);
                    MetaRow(col, "پایه", plan.Grade, ff);
                    MetaRow(col, "مربی", plan.Instructor?.Name, ff);
                    MetaRow(col, "شعبه", plan.Branch?.Name, ff);
                    MetaRow(col, "تعداد جلسات", plan.SessionCount.ToString(), ff);
                    MetaRow(col, "وضعیت", plan.Status, ff);
                    Section(col, "هدف کلی", plan.GeneralObjective, ff);
                    Section(col, "اهداف جزئی", plan.Objectives, ff);
                    Section(col, "اهداف رفتاری", plan.BehavioralObjectives, ff);
                    Section(col, "پیش‌نیازها", plan.Prerequisites, ff);
                    Section(col, "ارزشیابی تشخیصی", plan.DiagnosticEvaluation, ff);
                    Section(col, "مرحله آمادگی", plan.PreparationPhase, ff);
                    Section(col, "مرحله معرفی", plan.IntroductionPhase, ff);
                    Section(col, "مرحله ارائه", plan.PresentationPhase, ff);
                    Section(col, "مرحله خلاصه", plan.SummaryPhase, ff);
                    Section(col, "مرحله ارزشیابی", plan.EvaluationPhase, ff);
                    Section(col, "فعالیت‌های تکمیلی", plan.SupplementaryActivities, ff);
                    Section(col, "روش تدریس", plan.TeachingMethod, ff);
                    Section(col, "وسایل آموزشی", plan.TeachingAids, ff);
                    Section(col, "منابع", plan.Sources, ff);
                    Section(col, "نتیجه ارزیاب", plan.EvaluationResult, ff);
                });
                PageFooter(page, ff);
            });
        }).GeneratePdf();

        return new ExportFile(pdf, $"lesson-plan-{planId}.pdf", "application/pdf");
    }

    public async Task<ExportFile> GetMonthlyPdfAsync(int year, int month, int? branchId, bool isStaff)
    {
        var startUtc = PersianMonthStart(year, month).ToUniversalTime();
        var (nextYear, nextMonth) = month == 12 ? (year + 1, 1) : (year, month + 1);
        var endUtc = PersianMonthStart(nextYear, nextMonth).ToUniversalTime();

        var query = _db.DailyReports
            .Include(r => r.Instructor).Include(r => r.Branch)
            .Where(r => r.Date >= startUtc && r.Date < endUtc);
        if (branchId is not null) query = query.Where(r => r.BranchId == branchId);
        var reports = await query.OrderBy(r => r.Date).Take(200).ToListAsync();

        var monthName = PersianMonthName(month);
        var ff = FontFamily;

        var pdf = Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(25, Unit.Millimetre);
                page.Header().Column(col =>
                {
                    col.Item().AlignRight().Text("گزارش ماهانه — سامانه مربی").FontSize(10).FontFamily(ff).FontColor(Colors.Grey.Darken1);
                    col.Item().AlignRight().Text($"{monthName} {year:0000}").FontSize(9).FontFamily(ff);
                });
                page.Content().Column(col =>
                {
                    col.Item().AlignRight().Text($"خلاصه ماه {monthName}").FontSize(16).Bold().FontFamily(ff);
                    MetaRow(col, "تعداد گزارش‌ها", reports.Count.ToString(), ff);
                    MetaRow(col, "تأییدشده", reports.Count(r => r.Status == "APPROVED").ToString(), ff);
                    MetaRow(col, "در انتظار", reports.Count(r => r.Status is "SUBMITTED" or "UNDER_REVIEW").ToString(), ff);
                    MetaRow(col, "بازگشتی", reports.Count(r => r.Status == "RETURNED").ToString(), ff);
                    col.Item().PaddingTop(10, Unit.Point).Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn();
                            c.RelativeColumn(1.5f);
                            c.RelativeColumn();
                            c.RelativeColumn(0.7f);
                        });
                        table.Header(h =>
                        {
                            h.Cell().Background(Colors.Grey.Lighten3).AlignRight().Padding(4, Unit.Point).Text("موضوع").Bold().FontFamily(ff);
                            h.Cell().Background(Colors.Grey.Lighten3).AlignRight().Padding(4, Unit.Point).Text("مربی").Bold().FontFamily(ff);
                            h.Cell().Background(Colors.Grey.Lighten3).AlignRight().Padding(4, Unit.Point).Text("شعبه").Bold().FontFamily(ff);
                            h.Cell().Background(Colors.Grey.Lighten3).AlignRight().Padding(4, Unit.Point).Text("وضعیت").Bold().FontFamily(ff);
                        });
                        foreach (var r in reports)
                        {
                            table.Cell().AlignRight().Padding(4, Unit.Point).Text(r.Subject).FontSize(9).FontFamily(ff);
                            table.Cell().AlignRight().Padding(4, Unit.Point).Text(r.Instructor?.Name ?? "").FontSize(9).FontFamily(ff);
                            table.Cell().AlignRight().Padding(4, Unit.Point).Text(r.Branch?.Name ?? "").FontSize(9).FontFamily(ff);
                            table.Cell().AlignRight().Padding(4, Unit.Point).Text(r.Status).FontSize(9).FontFamily(ff);
                        }
                    });
                });
                PageFooter(page, ff);
            });
        }).GeneratePdf();

        return new ExportFile(pdf, $"monthly-reports-{year:0000}-{month:00}.pdf", "application/pdf");
    }

    private static void MetaRow(ColumnDescriptor col, string label, string? value, string ff)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        col.Item().PaddingBottom(2, Unit.Point).Row(row =>
        {
            row.RelativeItem(1).AlignRight().Text(label).FontSize(9).SemiBold().FontFamily(ff).FontColor(Colors.Grey.Darken2);
            row.RelativeItem(2).AlignRight().Text(value).FontSize(10).FontFamily(ff);
        });
    }

    private static void Section(ColumnDescriptor col, string title, string? content, string ff)
    {
        if (string.IsNullOrWhiteSpace(content)) return;
        col.Item().PaddingTop(8, Unit.Point).AlignRight().Text(title).FontSize(12).Bold().FontFamily(ff);
        col.Item().Text(content).FontSize(10).FontFamily(ff).LineHeight(1.8f);
    }

    private static void PageFooter(PageDescriptor page, string ff)
    {
        page.Footer().AlignCenter().Text(t =>
        {
            t.Span("صفحه ").FontFamily(ff).FontSize(8);
            t.CurrentPageNumber().FontFamily(ff).FontSize(8);
            t.Span(" از ").FontFamily(ff).FontSize(8);
            t.TotalPages().FontFamily(ff).FontSize(8);
        });
    }
}
