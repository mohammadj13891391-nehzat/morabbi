import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { awardPoints, POINT_RULES } from "@/lib/points";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const where: any = {};
    if (user.role === "INSTRUCTOR" || user.role === "INSTRUCTOR_ASSISTANT") where.instructorId = user.id;
    else if (user.role === "BRANCH_MANAGER") where.branchId = user.branchId;
    const reports = await db.dailyReport.findMany({ where, include: { instructor: { select: { name: true } }, branch: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ reports });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    if (!["INSTRUCTOR", "INSTRUCTOR_ASSISTANT", "EVALUATOR", "BRANCH_MANAGER", "SUPERVISOR", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "فقط مربیان و مسئولان" }, { status: 403 });
    const body = await req.json();
    if (!body.subject || !body.content) return NextResponse.json({ error: "موضوع و متن الزامی است" }, { status: 400 });
    const report = await db.dailyReport.create({ data: {
      instructorId: user.id, branchId: user.branchId!,
      subject: body.subject, summary: body.summary || null,
      reportPattern: body.reportPattern || null, reportStyle: body.reportStyle || null,
      content: body.content, recommendations: body.recommendations || null,
      audience: body.audience || null, attendeesCount: body.attendeesCount || 0,
      quranRefs: JSON.stringify(body.quranRefs || []), hadithRefs: JSON.stringify(body.hadithRefs || []),
      challenges: body.challenges || null, solutions: body.solutions || null,
      pedagogicalNotes: body.pedagogicalNotes || null,
      // روش‌شناسی نهضت
      planType: body.planType || "daily",
      approach: body.approach || null,
      traineeCount: body.traineeCount || 0,
      stagePresentation: body.stagePresentation || null,
      stageThinking: body.stageThinking || null,
      stageDiscussion: body.stageDiscussion || null,
      stageReporting: body.stageReporting || null,
      groupEndurance: body.groupEndurance || null,
      groupSemiSpeed: body.groupSemiSpeed || null,
      groupSpeed: body.groupSpeed || null,
      evaluationSelf: body.evaluationSelf || null,
      evaluationResult: body.evaluationResult || null,
       status: body.status || "SUBMITTED",
    }});
    const r = POINT_RULES.REPORT_SAVED;
    await awardPoints(user.id, r.amount, r.reason, r.desc, "REPORT", report.id);
    return NextResponse.json({ report });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
