import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";
import { awardPoints, POINT_RULES } from "@/lib/points";

// POST /api/reports/status - تغییر وضعیت گزارش (تأیید / رد)
// Body: { id, status: "APPROVED" | "RETURNED" | "SUBMITTED", note? }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const canManage = ["BRANCH_MANAGER", "SUPERVISOR", "EVALUATOR", "ADMIN", "BROTHERS_SKILLS_SUPERVISOR", "SISTERS_SKILLS_SUPERVISOR"].includes(user.role);
    if (!canManage) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const body = await req.json();
    if (!body.id || !body.status) return NextResponse.json({ error: "id و status لازم است" }, { status: 400 });
    const report = await db.dailyReport.findUnique({ where: { id: body.id } });
    if (!report) return NextResponse.json({ error: "گزارش یافت نشد" }, { status: 404 });

    const approved = body.status === "APPROVED";
    await db.dailyReport.update({
      where: { id: body.id },
      data: { status: body.status, ...(approved ? { evaluatorId: user.id, evaluatedAt: new Date() } : {}), evaluationResult: body.note || null },
    });

    if (approved) {
      const r = POINT_RULES.REPORT_APPROVED;
      await awardPoints(report.instructorId, r.amount, r.reason, r.desc, "REPORT", report.id, user.id);
    }

    await notifyUser(
      report.instructorId,
      approved ? "report_approved" : "report_returned",
      approved ? `گزارش شما تأیید شد: ${report.subject}` : `گزارش شما برگشت خورد: ${report.subject}`,
      body.note || `${user.name}`,
      { reportId: report.id, status: body.status }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report status error:", error);
    return NextResponse.json({ error: "خطا در تغییر وضعیت" }, { status: 500 });
  }
}
