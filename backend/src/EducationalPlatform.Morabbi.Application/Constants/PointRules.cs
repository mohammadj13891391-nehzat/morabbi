namespace EducationalPlatform.Morabbi.Application.Constants;

public static class PointRules
{
    public const string ReportSaved = "REPORT_SAVED";
    public const string ReportApproved = "REPORT_APPROVED";
    public const string HighEvaluation = "HIGH_EVALUATION";
    public const string LessonSaved = "LESSON_SAVED";
    public const string LessonApproved = "LESSON_APPROVED";
    public const string SessionSaved = "SESSION_SAVED";
    public const string TaskCompleted = "TASK_COMPLETED";
    public const string TrackerItem = "TRACKER_ITEM";
    public const string RecognitionBonus = "RECOGNITION_BONUS";
    public const string ManualAward = "MANUAL_AWARD";

    public const int ReportSavedAmount = 5;
    public const int ReportApprovedAmount = 10;
    public const int HighEvaluationReportAmount = 15;
    public const int HighEvaluationLessonAmount = 20;
    public const int LessonSavedAmount = 8;
    public const int LessonApprovedAmount = 10;
    public const int SessionSavedAmount = 3;
    public const int TaskCompletedAmount = 1;
    public const int TrackerItemAmount = 1;

    public const double HighEvaluationThreshold = 80.0;
}
