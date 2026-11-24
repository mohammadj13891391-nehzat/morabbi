import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";

// POST /api/reminders/daily - Send reminders to instructors who haven't submitted today
// Can be called by a cron job or manually
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    // Only supervisors/admins can trigger reminders
    if (!["SUPERVISOR", "ADMIN", "BRANCH_MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all approved instructors
    const instructors = await db.user.findMany({
      where: { role: "INSTRUCTOR", approvalStatus: "APPROVED", active: true },
      select: { id: true, name: true },
    });

    let remindersSent = 0;

    for (const instructor of instructors) {
      // Check if they submitted a report today
      const todayReport = await db.dailyReport.findFirst({
        where: {
          instructorId: instructor.id,
          createdAt: { gte: today, lt: tomorrow },
        },
        select: { id: true },
      });

      if (!todayReport) {
        await notifyUser(
          instructor.id,
          "new_report",
          "یادآوری: گزارش امروز ثبت نشده",
          `${instructor.name}، هنوز گزارش امروز را ثبت نکرده‌اید. لطفاً در اسرع وقت ثبت کنید.`,
          { type: "daily_reminder" }
        );
        remindersSent++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${remindersSent} یادآوری ارسال شد`,
      totalInstructors: instructors.length,
      remindersSent,
    });
  } catch (error) {
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}
