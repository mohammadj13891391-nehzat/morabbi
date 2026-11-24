import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";

// POST /api/reports/return - Return a report to instructor for revision
// Body: { reportId, revisionNote }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    // Only supervisors/managers/evaluators can return reports
    const canReturn = ["BRANCH_MANAGER", "SUPERVISOR", "EVALUATOR", "BROTHERS_SKILLS_SUPERVISOR", "SISTERS_SKILLS_SUPERVISOR", "ADMIN"].includes(user.role);
    if (!canReturn) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await req.json();
    const { reportId, revisionNote } = body;

    if (!reportId || !revisionNote?.trim()) {
      return NextResponse.json({ error: "شناسه گزارش و یادداشت بازنگری الزامی است" }, { status: 400 });
    }

    const report = await db.dailyReport.findUnique({
      where: { id: reportId },
      select: { id: true, instructorId: true, subject: true, status: true },
    });

    if (!report) {
      return NextResponse.json({ error: "گزارش یافت نشد" }, { status: 404 });
    }

    if (report.status === "APPROVED") {
      return NextResponse.json({ error: "گزارش تأییدشده قابل بازگرداندن نیست" }, { status: 400 });
    }

    // Update report status to RETURNED
    await db.dailyReport.update({
      where: { id: reportId },
      data: {
        status: "RETURNED",
        evaluatorId: user.id,
        evaluatedAt: new Date(),
      },
    });

    // Add a comment with the revision note
    await db.comment.create({
      data: {
        targetType: "report",
        targetId: reportId,
        authorId: user.id,
        body: `📋 بازگرداندن برای بازنگری: ${revisionNote}`,
      },
    });

    // Notify the instructor
    await notifyUser(
      report.instructorId,
      "report_returned",
      `گزارش شما بازگردانده شد: ${report.subject}`,
      `${user.name}: ${revisionNote}`,
      { reportId, revisionNote }
    );

    return NextResponse.json({
      success: true,
      message: "گزارش با یادداشت بازنگری بازگردانده شد",
    });
  } catch (error) {
    console.error("Return report error:", error);
    return NextResponse.json({ error: "خطا در بازگرداندن گزارش" }, { status: 500 });
  }
}
