namespace EducationalPlatform.Morabbi.Application.Constants;

public static class GenericErrorMessages
{
    public static readonly object NotFound = new { message = "مورد مورد نظر یافت نشد." };
    public static readonly object InternalError = new { message = "خطایی در پردازش درخواست شما رخ داده است." };
    public static readonly object Unauthorized = new { message = "دسترسی غیرمجاز است." };
    public static readonly object Forbidden = new { message = "شما مجاز به انجام این کار نیستید." };
    public static readonly object Validation = new { message = "ورودی‌ها نامعتبر هستند." };
    public static readonly object LoginFailed = new { message = "تلفن یا رمز عبور نادرست است." };
    public static readonly object PendingApproval = new { message = "حساب شما در انتظار تأیید مسئول است." };
}
