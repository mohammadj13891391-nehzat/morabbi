using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class AiService : IAiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _db;
    private readonly ITarbiyatiService _tarbiyati;
    private readonly ILogger<AiService> _logger;

    public AiService(IHttpClientFactory httpClientFactory, IConfiguration configuration, AppDbContext db, ITarbiyatiService tarbiyati, ILogger<AiService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _db = db;
        _tarbiyati = tarbiyati;
        _logger = logger;
    }

    private string BaseUrl => (_configuration["Ai:BaseUrl"] ?? "https://api.z.ai/api/paas/v4").TrimEnd('/');
    private string ApiKey
    {
        get
        {
            var key = _configuration["Ai:ApiKey"];
            if (string.IsNullOrWhiteSpace(key))
            {
                key = Environment.GetEnvironmentVariable("ZAI_API_KEY");
            }
            return key ?? string.Empty;
        }
    }
    private string ChatModel => _configuration["Ai:ChatModel"] ?? "glm-4-flash";
    private string AudioModel => _configuration["Ai:AudioModel"] ?? "glm-4-asr";
    private string VisionModel => _configuration["Ai:VisionModel"] ?? ChatModel;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);

    public async Task<AiAssistantResponse> AssistantAsync(int userId, string userName, string userRole, AiAssistantRequest request)
    {
        EnsureConfigured();
        var (quranSources, hadithSources, bookSources) = await GatherSourcesAsync(request.Message, userId);

        var context = $"""
شما دستیار هوشمند سامانه «نهضت تربیتی حضرت سیدالشهدا علیه‌السلام» هستید.

# وظایف شما:
۱. پاسخ به سؤالات مربیان درباره گزارش‌نویسی و طرح‌درس‌نویسی
۲. راهنمایی بر اساس اسناد نهضت (اصول و روش گزارش‌نویسی + اصول و روش طرح‌درس‌نویسی)
۳. جستجو و ارجاع به آیات قرآن و روایات معتبر شیعی
۴. کمک به بهبود کیفیت گزارش‌ها و طرح‌درس‌ها
۵. پاسخ به سؤالات تربیتی و آموزشی

# ساختار گزارش (طبق سند نهضت):
- عنوان، چکیده، بدنه (تقسیم‌بندی موضوعات)، توصیه‌ها
- الگو: تقدّم زمانی، قیاسی، استقرایی
- سبک: توصیفی، تحلیلی، انتقادی، تجویزی
- اصول: دقت محتوایی، ظاهر حرفه‌ای، بهره‌وری، ثبات ساختار، کاربردی بودن

# ساختار طرح درس (طبق سند نهضت):
- عنوان و عناوین فرعی
- هدف کلی، اهداف جزئی، اهداف رفتاری (با عملکرد، شرایط، معیار)
- پیش‌نیازها، ارزشیابی تشخیصی
- مراحل تدریس: آمادگی، معرفی، ارائه، خلاصه، ارزشیابی، تکمیلی
- روش تدریس، وسایل آموزشی، سؤال‌های ارزشیابی

# اطلاعات کاربر:
- نام: {userName}
- نقش: {userRole}

# آیات قرآن مرتبط با سؤال کاربر:
{string.Join("\n", quranSources.DefaultIfEmpty("یافت نشد"))}

# روایات مرتبط با سؤال کاربر:
{string.Join("\n", hadithSources.DefaultIfEmpty("یافت نشد"))}

# کتاب‌های آموزشی مرتبط (مطابق حلقهٔ تربیتی مربی):
{string.Join("\n", bookSources.DefaultIfEmpty("یافت نشد"))}
""";

        var userMessage = string.IsNullOrWhiteSpace(request.Context)
            ? request.Message
            : $"زمینه: {request.Context}\n\nسؤال: {request.Message}";

        var reply = await ChatAsync(context, userMessage);
        return new AiAssistantResponse(reply, quranSources, hadithSources);
    }

    public async Task<AiEvaluateResponse> EvaluateAsync(string targetType, int targetId)
    {
        EnsureConfigured();
        var (target, criteria, label) = await LoadTargetAsync(targetType, targetId)
            ?? throw new KeyNotFoundException("هدف یافت نشد.");
        if (criteria.Count == 0)
        {
            throw new InvalidOperationException("معیاری برای این نوع سند فعال نیست.");
        }

        var criteriaList = string.Join("\n", criteria.Select((c, i) =>
            $"{i + 1}. [{c.Id}] {c.Title} (وزن {c.Weight}) — سطح‌ها از عالی تا ضعیف: {string.Join(" / ", ParseLevels(c.RubricLevels))}"));
        var targetText = TargetTextOf(target);
        var instructorName = (await _db.Users.FindAsync(GetInstructorId(target)))?.Name ?? "";

        var prompt = $$"""
بر اساس محتوای زیر، برای هر معیار یک نمره کیفی بین ۰ تا ۱۰۰ بده (۱۰۰ = عالی/کامل، ۰ = بسیار ضعیف).
سطح‌های ذکرشده هر معیار را راهنمای تقسیم‌بندی این بازه در نظر بگیر.
فرمت خروجی فقط JSON خالص (بدون Markdown):
{"scores": {"<id معیار>": <نمره ۰ تا ۱۰۰>}, "comment": "<نظر کلی ۲ تا ۳ جمله فارسی>", "suggestions": ["<پیشنهاد ۱>", "<پیشنهاد ۲>"]}

# نوع سند: {{label}}
# مربی: {{instructorName}}
# محتوای سند:
{{targetText}}

# معیارهای ارزیابی:
{{criteriaList}}
""";

        var reply = await ChatAsync("شما ارزیاب دقیق و منصف هستید. فقط JSON خالص برگردانید.", prompt);
        if (ExtractJsonNode(reply) is not JsonObject json)
        {
            return new AiEvaluateResponse(null, reply, null, new List<string> { "پاسخ AI به صورت JSON معتبر نبود." });
        }

        var rawScores = json["scores"]?.AsObject() ?? new JsonObject();
        // Normalise keys so "1", "[1]", "1 " all map to the numeric id,
        // and values may come as numbers (2) or strings ("2").
        var scoreMap = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var (k, v) in rawScores)
        {
            var digits = new string(k.Where(char.IsDigit).ToArray());
            if (digits.Length == 0) continue;
            var raw = v?.ToString() ?? string.Empty;
            if (raw.Length >= 2 && raw.StartsWith("\"") && raw.EndsWith("\""))
            {
                raw = raw[1..^1];
            }
            scoreMap[digits] = raw;
        }
        var scores = new JsonObject();
        foreach (var (k, v) in scoreMap)
        {
            scores[k] = v;
        }
        var suggestions = json["suggestions"]?.AsArray()
            ?.Select(n => n.ToString()).Where(s => !string.IsNullOrWhiteSpace(s)).ToList()
            ?? new List<string>();
        var comment = json["comment"]?.GetValue<string>();

        double? percent = null;
        if (scoreMap.Count > 0)
        {
            // Scores are 0-100 quality (higher = better), matching the manual form and
            // EvaluationService.ComputeWeightedPercent.
            double weighted = 0, weightTotal = 0;
            foreach (var c in criteria)
            {
                if (!scoreMap.TryGetValue(c.Id.ToString(), out var raw)) continue;
                if (!double.TryParse(raw, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var score)) continue;
                var quality = Math.Clamp(score, 0, 100) / 100;
                weighted += quality * c.Weight;
                weightTotal += c.Weight;
            }
            percent = weightTotal > 0 ? Math.Round(weighted / weightTotal * 100, 1) : null;
        }

        return new AiEvaluateResponse(percent, comment, scores, suggestions);
    }

    public async Task<AiLessonPlanResponse> GenerateLessonPlanAsync(int userId, AiLessonPlanRequest request)
    {
        EnsureConfigured();
        var (quranSources, hadithSources, bookSources) = await GatherSourcesAsync(request.Subject, userId);

        var gradeLine = string.IsNullOrWhiteSpace(request.Grade) ? "" : $"پایه/سطح: {request.Grade}. ";
        var prompt = $$"""
برای موضوع «{{request.Subject}}» یک طرح درس کامل، کاربردی و منسجم بنویس.
{{gradeLine}}تعداد جلسات: {{request.SessionCount}}.

فقط JSON خالص (بدون Markdown و بدون توضیح اضافه) با دقیقاً این کلیدها برگردان:
{
  "title": "عنوان مناسب طرح درس",
  "generalObjective": "هدف کلی",
  "objectives": ["هدف جزئی ۱", "هدف جزئی ۲"],
  "behavioralObjectives": "اهداف رفتاری (با عملکرد، شرایط، معیار)",
  "subHeadings": "زیرمباحث",
  "prerequisites": "پیش‌نیازها",
  "diagnosticEvaluation": "ارزیابی تشخیصی",
  "preparationPhase": "مرحله آمادگی",
  "introductionPhase": "مرحله مقدمه‌سازی",
  "presentationPhase": "مرحله ارائه",
  "summaryPhase": "مرحله جمع‌بندی",
  "evaluationPhase": "مرحله ارزشیابی",
  "supplementaryActivities": "فعالیت‌های تکمیلی",
  "teachingMethod": "روش تدریس",
  "teachingAids": "وسایل کمک‌آموزشی",
  "evaluationQuestions": "سؤالات ارزشیابی",
  "contentOutline": "طرح محتوا",
  "evaluationMethod": "روش ارزشیابی",
  "quranRefs": ["ارجاع قرآنی ۱"],
  "hadithRefs": ["ارجاع حدیثی ۱"]
}

مطالب را بر اساس اسناد نهضت، آیات قرآن و روایات مرتبط و کتاب‌های آموزشی زیر بنویس:

# آیات قرآن مرتبط:
{{string.Join("\n", quranSources.DefaultIfEmpty("یافت نشد"))}}

# روایات مرتبط:
{{string.Join("\n", hadithSources.DefaultIfEmpty("یافت نشد"))}}

# کتاب‌های آموزشی مرتبط (مطابق حلقهٔ تربیتی مربی):
{{string.Join("\n", bookSources.DefaultIfEmpty("یافت نشد"))}}
""";

        var reply = await ChatAsync("شما طراح طرح درس حرفه‌ای هستید. فقط JSON خالص برگردانید.", prompt);
        if (ExtractJsonNode(reply) is not JsonObject json)
        {
            return new AiLessonPlanResponse(null, quranSources, hadithSources);
        }
        return new AiLessonPlanResponse(json, quranSources, hadithSources);
    }

    public async Task<AiTranscribeResponse> TranscribeAsync(byte[] audio, string fileName, string contentType)
    {
        EnsureConfigured();
        var client = CreateClient();
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(audio);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "file", fileName);
        content.Add(new StringContent(AudioModel), "model");

        var response = await client.PostAsync(BaseUrl + "/audio/transcriptions", content);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("AI transcribe failed: {Status} {Body}", response.StatusCode, Truncate(body, 300));
            throw new HttpRequestException($"خطا در دوبخش‌نویسی صوت ({(int)response.StatusCode}).");
        }
        var json = JsonNode.Parse(body) as JsonObject ?? new JsonObject();
        return new AiTranscribeResponse(json["text"]?.GetValue<string>() ?? string.Empty, null);
    }

    public async Task<AiOcrResponse> OcrAsync(byte[] image, string fileName, string contentType)
    {
        EnsureConfigured();
        var dataUrl = $"data:{contentType};base64,{Convert.ToBase64String(image)}";
        var body = new JsonObject
        {
            { "model", VisionModel },
            { "max_tokens", 4000 },
            { "messages", new JsonArray(new JsonObject
            {
                { "role", "user" },
                { "content", new JsonArray(
                    new JsonObject { { "type", "text" }, { "text", "متن این تصویر را دقیق و کامل استخراج کنید. فقط متن را برگردانید." } },
                    new JsonObject { { "type", "image_url" }, { "image_url", new JsonObject { { "url", dataUrl } } } }) }
            }) }
        };

        var client = CreateClient();
        using var content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(BaseUrl + "/chat/completions", content);
        var respBody = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("AI ocr failed: {Status} {Body}", response.StatusCode, Truncate(respBody, 300));
            throw new HttpRequestException($"خطا در خواندن تصویر ({(int)response.StatusCode}).");
        }
        var json = JsonNode.Parse(respBody) as JsonObject ?? new JsonObject();
        return new AiOcrResponse(json["choices"]?[0]?["message"]?["content"]?.GetValue<string>() ?? string.Empty);
    }

    // ===== internals =====

    private async Task<string> ChatAsync(string system, string user)
    {
        var body = new JsonObject
        {
            { "model", ChatModel },
            { "temperature", 0.7 },
            { "max_tokens", 1200 },
            { "thinking", new JsonObject { { "type", "disabled" } } },
            { "messages", new JsonArray(
                new JsonObject { { "role", "system" }, { "content", system } },
                new JsonObject { { "role", "user" }, { "content", user } })
            }
        };
        var client = CreateClient();
        using var content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(BaseUrl + "/chat/completions", content);
        var respBody = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("AI chat failed: {Status} {Body}", response.StatusCode, Truncate(respBody, 300));
            throw new HttpRequestException($"خطا در دریافت پاسخ هوش مصنوعی ({(int)response.StatusCode}).");
        }
        var json = JsonNode.Parse(respBody) as JsonObject ?? new JsonObject();
        return json["choices"]?[0]?["message"]?["content"]?.GetValue<string>() ?? "متأسفانه پاسخی دریافت نشد.";
    }

    private async Task<(List<string>, List<string>, List<string>)> GatherSourcesAsync(string message, int userId)
    {
        var q = message.Length > 60 ? message[..60] : message;
        var quran = await _tarbiyati.SearchQuranVersesAsync(q, 3);
        var hadiths = await _tarbiyati.SearchHadithsAsync(q, 3, includeText: false);
        var quranSources = quran.Select(v => $"[{v.Surah}:{v.VerseNo}] {Truncate(v.TextFa ?? v.TextAr, 200)}").ToList();
        var hadithSources = hadiths.Select(h => $"[{h.Source}/{h.Narrator}] {Truncate(h.TextFa ?? h.TextAr, 200)}").ToList();
        var bookSources = await GatherBookSourcesAsync(message, userId);
        return (quranSources, hadithSources, bookSources);
    }

    private async Task<List<string>> GatherBookSourcesAsync(string message, int userId)
    {
        var loop = (await _db.Users.FirstOrDefaultAsync(u => u.Id == userId))?.TrainingLoop;
        var books = await _db.Books
            .Where(b => b.IsActive)
            .AsNoTracking()
            .ToListAsync();
        var candidates = books.Where(b => b.MatchesLoop(loop)).ToList();
        if (candidates.Count == 0) return new List<string>();

        var keywords = message
            .Split(' ', '،', ',', '؛', ';', '؟', '?', '!', '.', '!', '\n', '\r', '\t')
            .Select(w => w.Trim())
            .Where(w => w.Length >= 3)
            .Distinct()
            .Take(8)
            .ToList();

        var scored = candidates
            .Select(b =>
            {
                var haystack = $"{b.Title} {b.Description ?? ""} {b.Content}";
                var score = keywords.Sum(k =>
                {
                    var hits = 0;
                    var idx = 0;
                    while ((idx = haystack.IndexOf(k, idx, StringComparison.Ordinal)) >= 0)
                    {
                        hits++;
                        idx += k.Length;
                        if (hits >= 10) break;
                    }
                    return hits * (k.Length >= 5 ? 2 : 1);
                });
                return (Book: b, Score: score + (string.IsNullOrWhiteSpace(loop) ? 0 : b.Loops == "" ? 0 : 1));
            })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .Take(3)
            .ToList();

        var fallback = candidates
            .Where(b => scored.All(s => s.Book.Id != b.Id))
            .OrderByDescending(b => b.UpdatedAt)
            .Take(1)
            .Select(b => new { Book = b, Score = 0 })
            .ToList();
        if (scored.Count == 0) scored = fallback.Select(f => (f.Book, 1)).Cast<(Book Book, int Score)>().ToList();

        return scored
            .Select(x => $"[کتاب: {x.Book.Title}{(!string.IsNullOrWhiteSpace(x.Book.Author) ? $" / {x.Book.Author}" : "")}] {Truncate(x.Book.Content, 500)}")
            .ToList();
    }

    private async Task<(object Target, List<EvaluationCriteria> Criteria, string Label)?> LoadTargetAsync(string targetType, int targetId)
    {
        if (targetType == "report")
        {
            var report = await _db.DailyReports.FirstOrDefaultAsync(r => r.Id == targetId);
            if (report is null) return null;
            var criteria = await _db.EvaluationCriteria.Where(c => c.Type == "REPORT" && c.Active).OrderBy(c => c.Id).ToListAsync();
            return (report, criteria, "گزارش روزانه");
        }
        var plan = await _db.LessonPlans.FirstOrDefaultAsync(p => p.Id == targetId);
        if (plan is null) return null;
        var planCriteria = await _db.EvaluationCriteria.Where(c => c.Type == "LESSON_PLAN" && c.Active).OrderBy(c => c.Id).ToListAsync();
        return (plan, planCriteria, "طرح درس");
    }

    private static int GetInstructorId(object target) => target switch
    {
        DailyReport r => r.InstructorId,
        LessonPlan p => p.InstructorId,
        _ => 0
    };

    private static string TargetTextOf(object target) => target switch
    {
        DailyReport r => $"{r.Subject}\n{r.Summary ?? ""}\n{r.Content}\n{r.Recommendations ?? ""}\n{r.Challenges ?? ""}\n{r.Solutions ?? ""}",
        LessonPlan p => $"{p.Title}\n{p.Subject}\n{p.GeneralObjective ?? ""}\n{p.BehavioralObjectives ?? ""}\n{p.PresentationPhase ?? ""}\n{p.TeachingMethod ?? ""}",
        _ => string.Empty
    };

    private static List<string> ParseLevels(string rubricJson)
    {
        if (string.IsNullOrWhiteSpace(rubricJson)) return new() { "عالی", "متوسط", "ضعیف" };
        try
        {
            if (JsonNode.Parse(rubricJson) is JsonArray arr && arr.Count > 1)
            {
                return arr.Select(n => n.ToString()).ToList();
            }
        }
        catch (JsonException)
        {
        }
        return new() { "عالی", "متوسط", "ضعیف" };
    }

    private static JsonNode? ExtractJsonNode(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start) return null;
        try
        {
            return JsonNode.Parse(text[start..(end + 1)]);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string Truncate(string? text, int max)
    {
        if (string.IsNullOrWhiteSpace(text)) return "";
        return text.Length <= max ? text : text[..max];
    }

    private HttpClient CreateClient()
    {
        var client = _httpClientFactory.CreateClient("ai");
        client.Timeout = TimeSpan.FromSeconds(120);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", ApiKey);
        client.DefaultRequestHeaders.Add("X-Z-AI-From", "Z");
        return client;
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("هوش مصنوعی پیکربندی نشده است (Ai:ApiKey در appsettings یا env).");
        }
    }
}
