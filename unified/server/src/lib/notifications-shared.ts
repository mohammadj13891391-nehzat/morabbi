// Shared notification types and labels - safe for client-side use

export type NotificationType =
  | "new_report"           // گزارش جدید ثبت شده
  | "evaluation_done"      // ارزیابی انجام شده
  | "comment_added"        // کامنت جدید
  | "recognition_awarded"  // تقدیر اعطا شده
  | "report_returned"      // گزارش بازگشت خورده
  | "new_lesson_plan";     // طرح درس جدید

// Notification display labels in Persian
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  new_report: "گزارش جدید",
  evaluation_done: "ارزیابی انجام شد",
  comment_added: "پیام جدید",
  recognition_awarded: "تقدیر جدید",
  report_returned: "گزارش بازگشت خورده",
  new_lesson_plan: "طرح درس جدید",
};
