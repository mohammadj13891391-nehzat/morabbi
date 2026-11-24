import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";
import { awardPoints, POINT_RULES } from "@/lib/points";

// POST /api/lesson-plans/status - تغییر وضعیت طرح درس (تأیید / رد)
// Body: { id, status: "APPROVED" | "RETURNED" | "SUBMITTED", note? }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const canManage = ["BRANCH_MANAGER", "SUPERVISOR", "EVALUATOR", "ADMIN", "BROTHERS_SKILLS_SUPERVISOR", "SISTERS_SKILLS_SUPERVISOR"].includes(user.role);
    if (!canManage) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const body = await req.json();
    if (!body.id || !body.status) return NextResponse.json({ error: "id و status لازم است" }, { status: 400 });
    const plan = await db.lessonPlan.findUnique({ where: { id: body.id } });
    if (!plan) return NextResponse.json({ error: "طرح درس یافت نشد" }, { status: 404 });

    const approved = body.status === "APPROVED";
    await db.lessonPlan.update({
      where: { id: body.id },
      data: { status: body.status, ...(approved ? { evaluatorId: user.id, evaluatedAt: new Date() } : {}), evaluationResult: body.note || null },
    });

    if (approved) {
      const r = POINT_RULES.LESSON_APPROVED;
      await awardPoints(plan.instructorId, r.amount, r.reason, r.desc, "LESSON", plan.id, user.id);
    }

    await notifyUser(
      plan.instructorId,
      approved ? "lesson_approved" : "lesson_returned",
      approved ? `طرح درس شما تأیید شد: ${plan.title}` : `طرح درس شما برگشت خورد: ${plan.title}`,
      body.note || `${user.name}`,
      { planId: plan.id, status: body.status }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lesson status error:", error);
    return NextResponse.json({ error: "خطا در تغییر وضعیت" }, { status: 500 });
  }
}
