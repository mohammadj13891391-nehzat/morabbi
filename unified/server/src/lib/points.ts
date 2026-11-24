// امتیازدهی متمرکز — الگوی v23
import { db } from "./db";

export async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  description?: string,
  sourceType?: string,
  sourceId?: string,
  awardedBy?: string
): Promise<void> {
  try {
    const tx = await db.pointTransaction.create({
      data: {
        userId,
        amount,
        reason: (reason as any) || "MANUAL_AWARD",
        description: description || null,
        sourceType: sourceType || null,
        sourceId: sourceId || null,
        awardedBy: awardedBy || userId,
        branchId: null,
      },
    });
    await db.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: amount } },
    });
    return tx;
  } catch (e) {
    console.error("awardPoints error:", e);
  }
}

// قوانین امتیاز v23
export const POINT_RULES = {
  REPORT_SAVED: { amount: 5, reason: "REPORT_SAVED", desc: "ثبت گزارش" },
  REPORT_APPROVED: { amount: 10, reason: "REPORT_APPROVED", desc: "تأیید گزارش" },
  REPORT_EXCELLENT: { amount: 15, reason: "HIGH_EVALUATION", desc: "گزارش عالی" },
  LESSON_SAVED: { amount: 8, reason: "LESSON_SAVED", desc: "ثبت طرح درس" },
  LESSON_APPROVED: { amount: 10, reason: "LESSON_APPROVED", desc: "تأیید طرح درس" },
  LESSON_EXCELLENT: { amount: 20, reason: "HIGH_EVALUATION", desc: "طرح درس عالی" },
  SESSION_SAVED: { amount: 3, reason: "SESSION_SAVED", desc: "ثبت صورتجلسه" },
  TASK_COMPLETED: { amount: 1, reason: "TASK_COMPLETED", desc: "انجام کار" },
  TRACKER_ITEM: { amount: 1, reason: "TRACKER_ITEM", desc: "برنامه روزانه" },
};
