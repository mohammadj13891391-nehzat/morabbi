// SMS Service - ارسال پیامک از طریق سرویس‌های ایرانی
// پشتیبانی از: کاوه‌نگار، ملی‌پیامک، پیامک اول، اس‌ام‌اس‌ایران

interface SendSMSInput {
  phone: string;        // 09xxxxxxxxx
  message: string;
}

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// تنظیمات از متغیرهای محیطی
const SMS_PROVIDER = process.env.SMS_PROVIDER || "kavenegar"; // kavenegar | melipayamak | smsir
const SMS_API_KEY = process.env.SMS_API_KEY || "";
const SMS_SENDER = process.env.SMS_SENDER || "";
const SMS_USERNAME = process.env.SMS_USERNAME || "";
const SMS_PASSWORD = process.env.SMS_PASSWORD || "";

// تبدیل شماره ایرانی به فرمت بین‌المللی
function toInternational(phone: string): string {
  // 09xxxxxxxxx → 989xxxxxxxxx
  if (phone.startsWith("09")) {
    return "98" + phone.slice(1);
  }
  if (phone.startsWith("98")) {
    return phone;
  }
  if (phone.startsWith("+98")) {
    return phone.slice(1);
  }
  return phone;
}

// === کاوه‌نگار ===
async function sendViaKavenegar(phone: string, message: string): Promise<SendSMSResult> {
  try {
    const receptor = toInternational(phone);
    const url = `https://api.kavenegar.com/v1/${SMS_API_KEY}/sms/send.json`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        receptor,
        message,
        sender: SMS_SENDER,
      }),
    });

    const data = await response.json();

    if (data.return && data.return.status === 200) {
      return {
        success: true,
        messageId: data.entries?.[0]?.messageid?.toString(),
      };
    }

    return {
      success: false,
      error: data.return?.message || "خطای کاوه‌نگار",
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// === ملی‌پیامک ===
async function sendViaMelipayamak(phone: string, message: string): Promise<SendSMSResult> {
  try {
    const url = "https://rest.payamak-panel.com/api/SMS/SendSMS";

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: SMS_USERNAME,
        password: SMS_PASSWORD,
        text: message,
        to: phone,
        from: SMS_SENDER,
        isFlash: false,
      }),
    });

    const data = await response.json();

    if (data.StrRetStatus === "Ok" || data.RetStatus === 1) {
      return { success: true, messageId: data.SMSId?.toString() };
    }

    return { success: false, error: "خطای ملی‌پیامک" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// === اس‌ام‌اس‌ایران (sms.ir) ===
async function sendViaSmsIr(phone: string, message: string): Promise<SendSMSResult> {
  try {
    // ابتدا توکن دریافت کن
    const tokenUrl = "https://api.sms.ir/v1/send";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SMS_API_KEY,
      },
      body: JSON.stringify({
        message,
        mobile: phone,
        lineNumber: SMS_SENDER,
      }),
    });

    const data = await response.json();

    if (data.status === 1) {
      return { success: true, messageId: data.data?.id };
    }

    return { success: false, error: data.message || "خطای sms.ir" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// === تابع اصلی ارسال ===
export async function sendSMS(phone: string, message: string): Promise<SendSMSResult> {
  // بررسی تنظیمات
  if (!SMS_API_KEY && !SMS_USERNAME) {
    console.warn("[SMS] سرویس پیامک تنظیم نشده. پیام نمایش داده نمی‌شود.");
    return {
      success: false,
      error: "سرویس پیامک پیکربندی نشده است",
    };
  }

  switch (SMS_PROVIDER) {
    case "kavenegar":
      return sendViaKavenegar(phone, message);
    case "melipayamak":
      return sendViaMelipayamak(phone, message);
    case "smsir":
      return sendViaSmsIr(phone, message);
    default:
      return { success: false, error: "سرویس پیامک ناشناخته" };
  }
}

// ارسال کد تأیید
export async function sendVerificationCode(phone: string, code: string): Promise<SendSMSResult> {
  const message = `نهضت تربیتی سیدالشهدا\nکد تأیید شما: ${code}\nاین کد ۵ دقیقه اعتبار دارد.`;
  return sendSMS(phone, message);
}
