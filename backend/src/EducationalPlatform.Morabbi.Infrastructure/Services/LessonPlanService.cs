using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class LessonPlanService : ILessonPlanService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public LessonPlanService(AppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<LessonPlan> CreateAsync(int instructorId, CreateLessonPlanRequest request)
    {
        var instructor = await _db.Users.FindAsync(instructorId)
            ?? throw new KeyNotFoundException("Instructor not found");

        var branchId = request.BranchId ?? instructor.BranchId
            ?? throw new InvalidOperationException("شعبه مشخص نشده است.");

        var plan = new LessonPlan
        {
            InstructorId = instructorId,
            BranchId = branchId,
            Title = request.Title,
            Subject = request.Subject ?? string.Empty,
            Grade = request.Grade,
            SessionCount = request.SessionCount ?? 1,
            GeneralObjective = request.GeneralObjective,
            Objectives = request.Objectives ?? "[]",
            BehavioralObjectives = request.BehavioralObjectives,
            SubHeadings = request.SubHeadings,
            Prerequisites = request.Prerequisites,
            DiagnosticEvaluation = request.DiagnosticEvaluation,
            PreparationPhase = request.PreparationPhase,
            IntroductionPhase = request.IntroductionPhase,
            PresentationPhase = request.PresentationPhase,
            SummaryPhase = request.SummaryPhase,
            EvaluationPhase = request.EvaluationPhase,
            SupplementaryActivities = request.SupplementaryActivities,
            TeachingMethod = request.TeachingMethod,
            TeachingAids = request.TeachingAids,
            EvaluationQuestions = request.EvaluationQuestions,
            ContentOutline = request.ContentOutline,
            EvaluationMethod = request.EvaluationMethod,
            QuranRefs = request.QuranRefs ?? "[]",
            HadithRefs = request.HadithRefs ?? "[]",
            Sources = request.Sources ?? "[]",
            PlanType = request.PlanType ?? "biweekly",
            Approach = request.Approach,
            TraineeCount = request.TraineeCount ?? 0,
            StagePresentation = request.StagePresentation,
            StageThinking = request.StageThinking,
            StageDiscussion = request.StageDiscussion,
            StageReporting = request.StageReporting,
            GroupEndurance = request.GroupEndurance,
            GroupSemiSpeed = request.GroupSemiSpeed,
            GroupSpeed = request.GroupSpeed,
            EvaluationSelf = request.EvaluationSelf,
            Status = ValidStatus(request.Status)
        };
        _db.LessonPlans.Add(plan);
        await _db.SaveChangesAsync();
        return plan;
    }

    public async Task<LessonPlan> UpdateAsync(int id, UpdateLessonPlanRequest request)
    {
        var plan = await _db.LessonPlans.FindAsync(id)
            ?? throw new KeyNotFoundException("Lesson plan not found");
        ApplyUpdate(plan, request);
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return plan;
    }

    public async Task ReturnAsync(int id, int evaluatorId, string? comment)
    {
        var plan = await _db.LessonPlans.FindAsync(id)
            ?? throw new KeyNotFoundException("Lesson plan not found");
        plan.Status = "RETURNED";
        plan.EvaluatorId = evaluatorId;
        plan.EvaluatedAt = DateTime.UtcNow;
        if (comment is not null)
        {
            plan.EvaluationResult = comment;
        }
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _notificationService.CreateAsync(
            plan.InstructorId, "plan_returned",
            "طرح درس شما بازمگشت",
            comment ?? "طرح درس شما توسط ارزیاب بازمگردانده شد.");
    }

    public async Task<List<LessonPlan>> GetByInstructorAsync(int instructorId)
    {
        return await _db.LessonPlans
            .Include(p => p.Branch)
            .Where(p => p.InstructorId == instructorId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<LessonPlan>> GetByBranchAsync(int branchId)
    {
        return await _db.LessonPlans
            .Include(p => p.Branch)
            .Include(p => p.Instructor)
            .Where(p => p.BranchId == branchId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<LessonPlan>> GetAllAsync()
    {
        return await _db.LessonPlans
            .Include(p => p.Branch)
            .Include(p => p.Instructor)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<LessonPlan?> FindByIdAsync(int id)
    {
        return await _db.LessonPlans
            .Include(p => p.Branch)
            .Include(p => p.Instructor)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    private static void ApplyUpdate(LessonPlan plan, UpdateLessonPlanRequest r)
    {
        if (r.Title is not null) plan.Title = r.Title;
        if (r.Subject is not null) plan.Subject = r.Subject;
        if (r.Grade is not null) plan.Grade = r.Grade;
        if (r.SessionCount.HasValue) plan.SessionCount = r.SessionCount.Value;
        if (r.GeneralObjective is not null) plan.GeneralObjective = r.GeneralObjective;
        if (r.Objectives is not null) plan.Objectives = r.Objectives;
        if (r.BehavioralObjectives is not null) plan.BehavioralObjectives = r.BehavioralObjectives;
        if (r.SubHeadings is not null) plan.SubHeadings = r.SubHeadings;
        if (r.Prerequisites is not null) plan.Prerequisites = r.Prerequisites;
        if (r.DiagnosticEvaluation is not null) plan.DiagnosticEvaluation = r.DiagnosticEvaluation;
        if (r.PreparationPhase is not null) plan.PreparationPhase = r.PreparationPhase;
        if (r.IntroductionPhase is not null) plan.IntroductionPhase = r.IntroductionPhase;
        if (r.PresentationPhase is not null) plan.PresentationPhase = r.PresentationPhase;
        if (r.SummaryPhase is not null) plan.SummaryPhase = r.SummaryPhase;
        if (r.EvaluationPhase is not null) plan.EvaluationPhase = r.EvaluationPhase;
        if (r.SupplementaryActivities is not null) plan.SupplementaryActivities = r.SupplementaryActivities;
        if (r.TeachingMethod is not null) plan.TeachingMethod = r.TeachingMethod;
        if (r.TeachingAids is not null) plan.TeachingAids = r.TeachingAids;
        if (r.EvaluationQuestions is not null) plan.EvaluationQuestions = r.EvaluationQuestions;
        if (r.ContentOutline is not null) plan.ContentOutline = r.ContentOutline;
        if (r.EvaluationMethod is not null) plan.EvaluationMethod = r.EvaluationMethod;
        if (r.QuranRefs is not null) plan.QuranRefs = r.QuranRefs;
        if (r.HadithRefs is not null) plan.HadithRefs = r.HadithRefs;
        if (r.Sources is not null) plan.Sources = r.Sources;
        if (r.PlanType is not null) plan.PlanType = r.PlanType;
        if (r.Approach is not null) plan.Approach = r.Approach;
        if (r.TraineeCount.HasValue) plan.TraineeCount = r.TraineeCount.Value;
        if (r.StagePresentation is not null) plan.StagePresentation = r.StagePresentation;
        if (r.StageThinking is not null) plan.StageThinking = r.StageThinking;
        if (r.StageDiscussion is not null) plan.StageDiscussion = r.StageDiscussion;
        if (r.StageReporting is not null) plan.StageReporting = r.StageReporting;
        if (r.GroupEndurance is not null) plan.GroupEndurance = r.GroupEndurance;
        if (r.GroupSemiSpeed is not null) plan.GroupSemiSpeed = r.GroupSemiSpeed;
        if (r.GroupSpeed is not null) plan.GroupSpeed = r.GroupSpeed;
        if (r.EvaluationSelf is not null) plan.EvaluationSelf = r.EvaluationSelf;
        if (ValidStatus(r.Status) is string s) plan.Status = s;
    }

    private static string? ValidStatus(string? status)
    {
        return status is "DRAFT" or "SUBMITTED" or "UNDER_REVIEW" or "APPROVED" or "RETURNED" ? status : null;
    }
}
