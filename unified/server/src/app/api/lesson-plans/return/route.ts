import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";

// POST /api/lesson-plans/return - Return a lesson plan for revision
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    const canReturn = ["BRANCH_MANAGER", "SUPERVISOR", "EVALUATOR", "BROTHERS_SKILLS_SUPERVISOR", "SISTERS_SKILLS_SUPERVISOR", "ADMIN"].includes(user.role);
    if (!canReturn) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const { planId, revisionNote } = await req.json();
    if (!planId || !revisionNote?.trim()) return NextResponse.json({ error: "شناسه و یادداشت الزامی است" }, { status: 400 });

    const plan = await db.lessonPlan.findUnique({ where: { id: planId }, select: { id: true, instructorId: true, title: true, status: true } });
    if (!plan) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    if (plan.status === "APPROVED") return NextResponse.json({ error: "تأییدشده قابل بازگرداندن نیست" }, { status: 400 });

    await db.lessonPlan.update({ where: { id: planId }, data: { status: "RETURNED", evaluatorId: user.id, evaluatedAt: new Date() } });
    await db.comment.create({ data: { targetType: "lesson_plan", targetId: planId, authorId: user.id, body: `📋 بازگرداندن برای بازنگری: ${revisionNote}` } });
    await notifyUser(plan.instructorId, "report_returned", `طرح درس بازگردانده شد: ${plan.title}`, `${user.name}: ${revisionNote}`, { planId });

    return NextResponse.json({ success: true, message: "بازگردانده شد" });
  } catch (error) {
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}
