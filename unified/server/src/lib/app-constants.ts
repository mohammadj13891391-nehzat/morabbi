// Shared constants
export type View = "dashboard" | "new_report" | "reports_list" | "new_lesson_plan" | "lesson_plans_list" | "recognition" | "quran_search" | "search" | "profile" | "charts" | "analytics" | "guide" | "pending_approvals" | "sync_status" | "settings";

export const ROLE_LABELS: Record<string, string> = {
  INSTRUCTOR: "مربی", INSTRUCTOR_ASSISTANT: "مربی یار", EVALUATOR: "ارزیاب",
  BRANCH_MANAGER: "مسئول شعبه", BROTHERS_SKILLS_SUPERVISOR: "مسئول مهارتی برادران",
  SISTERS_SKILLS_SUPERVISOR: "مسئول مهارتی خواهران", SUPERVISOR: "مسئول", ADMIN: "مدیر سیستم",
};

export const REGISTRATION_ROLES = [
  { value: "INSTRUCTOR", label: "مربی" }, { value: "INSTRUCTOR_ASSISTANT", label: "مربی یار" },
  { value: "EVALUATOR", label: "ارزیاب" }, { value: "BRANCH_MANAGER", label: "مسئول شعبه" },
  { value: "BROTHERS_SKILLS_SUPERVISOR", label: "مسئول مهارتی برادران" },
  { value: "SISTERS_SKILLS_SUPERVISOR", label: "مسئول مهارتی خواهران" },
  { value: "SUPERVISOR", label: "مسئول" },
];

export const REPORT_STATUS_LABELS: Record<string, string> = { DRAFT: "پیش‌نویس", SUBMITTED: "ارسال شده", UNDER_REVIEW: "در حال بررسی", APPROVED: "تأیید شده", RETURNED: "بازگشت خورده" };
export const REPORT_STATUS_COLORS: Record<string, string> = { DRAFT: "bg-muted text-muted-foreground", SUBMITTED: "bg-amber-100 text-amber-800", UNDER_REVIEW: "bg-blue-100 text-blue-800", APPROVED: "bg-emerald-100 text-emerald-800", RETURNED: "bg-red-100 text-red-800" };
export const RECOGNITION_LEVEL_LABELS: Record<string, string> = { WEEKLY_BRANCH: "سابق هفتگی شعبه", MONTHLY_BRANCH: "سابق ماهانه شعبه", MONTHLY_CENTRAL: "السابق ماهانه مرکزی", SPECIAL: "تقدیر ویژه" };
export const SESSION_STORAGE_KEY = "morabbi_session_token";

function getSessionToken(): string | null { if (typeof window === "undefined") return null; return localStorage.getItem(SESSION_STORAGE_KEY); }

export async function apiFetch(url: string, options: RequestInit = {}, _legacy?: string) {
  const headers = new Headers(options.headers);
  const token = getSessionToken();
  if (token) headers.set("x-user-id", token);
  else if (_legacy) headers.set("x-user-id", _legacy);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) { const error = await res.json().catch(() => ({ error: "خطای ناشناخته" })); throw new Error(error.error || `خطای HTTP ${res.status}`); }
  return res.json();
}
