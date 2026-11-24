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
    const lessonPlans = await db.lessonPlan.findMany({ where, include: { instructor: { select: { name: true } }, branch: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ lessonPlans });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    if (!["INSTRUCTOR", "INSTRUCTOR_ASSISTANT", "EVALUATOR", "BRANCH_MANAGER", "SUPERVISOR", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "فقط مربیان و مسئولان" }, { status: 403 });
    const body = await req.json();
    if (!body.title || !body.subject) return NextResponse.json({ error: "عنوان و موضوع الزامی است" }, { status: 400 });
    const lessonPlan = await db.lessonPlan.create({ data: {
      instructorId: user.id, branchId: user.branchId!,
      title: body.title, subject: body.subject, grade: body.grade || null,
      sessionCount: body.sessionCount || 1,
      generalObjective: body.generalObjective || null,
      objectives: JSON.stringify(body.objectives || []),
      behavioralObjectives: body.behavioralObjectives || null,
      subHeadings: body.subHeadings || null, prerequisites: body.prerequisites || null,
      diagnosticEvaluation: body.diagnosticEvaluation || null,
      preparationPhase: body.preparationPhase || null, introductionPhase: body.introductionPhase || null,
      presentationPhase: body.presentationPhase || null, summaryPhase: body.summaryPhase || null,
      evaluationPhase: body.evaluationPhase || null, supplementaryActivities: body.supplementaryActivities || null,
      teachingMethod: body.teachingMethod || null, teachingAids: body.teachingAids || null,
      evaluationQuestions: body.evaluationQuestions || null,
      quranRefs: JSON.stringify(body.quranRefs || []), hadithRefs: JSON.stringify(body.hadithRefs || []),
      sources: JSON.stringify(body.sources || []),
      // روش‌شناسی نهضت
      planType: body.planType || "biweekly",
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
    const r = POINT_RULES.LESSON_SAVED;
    await awardPoints(user.id, r.amount, r.reason, r.desc, "LESSON", lessonPlan.id);
    return NextResponse.json({ lessonPlan });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
