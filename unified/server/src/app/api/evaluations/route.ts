import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";
import { awardPoints } from "@/lib/points";

const EVAL_ROLES = ["BRANCH_MANAGER", "CENTRAL_SUPERVISOR", "SUPERVISOR", "ADMIN", "EVALUATOR"];

// scores: آرایه v23 [{criteriaId, criteriaName, score, maxScore}] یا آبجکت {[id]: {score}}
function computeTotals(scores: any, criteria: any[]) {
  let total = 0, max = 0;
  if (Array.isArray(scores)) {
    for (const s of scores) { total += Number(s.score) || 0; max += Number(s.maxScore) || 0; }
  } else if (scores && typeof scores === "object") {
    for (const [cid, val] of Object.entries(scores)) {
      const c = criteria.find(x => x.id === cid);
      const m = Number(c?.weight) || 10;
      total += Number(typeof val === "object" && val !== null ? val.score : val) || 0;
      max += m;
    }
  }
  return { total, max };
}

// GET /api/evaluations - List evaluations + criteria
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    const criteriaType = targetType === "lesson_plan" || targetType === "LESSON" ? "LESSON_PLAN" : "REPORT";
    const criteria = await db.evaluationCriteria.findMany({
      where: { type: criteriaType, active: true },
      orderBy: [{ type: "asc" }, { weight: "desc" }],
    });

    let evaluations: any[] = [];
    if (targetId) {
      evaluations = await db.evaluation.findMany({
        where: { targetType, targetId },
        include: { evaluator: { select: { id: true, name: true } }, aiSuggestion: { select: { id: true, outputJson: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // لیست عمومی — با عنوان هدف
      const recent = await db.evaluation.findMany({
        include: { evaluator: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }, take: 50,
      });
      for (const ev of recent) {
        const { total, max } = computeTotals(JSON.parse(ev.scores || "{}"), criteria);
        const target = ev.targetType === "report"
          ? await db.dailyReport.findUnique({ where: { id: ev.targetId }, select: { id: true, subject: true, instructor: { select: { id: true, name: true } }, status: true } })
          : await db.lessonPlan.findUnique({ where: { id: ev.targetId }, select: { id: true, title: true, instructor: { select: { id: true, name: true } }, status: true } });
        evaluations.push({
          ...ev,
          totalScore: total, maxScore: max,
          targetTitle: target ? (target as any).subject || (target as any).title : null,
          targetUid: target ? (target as any).instructor.id : null,
          instructorName: target ? (target as any).instructor.name : null,
        });
      }
    }

    return NextResponse.json({ criteria, evaluations });
  } catch (error) {
    console.error("Get evaluations error:", error);
    return NextResponse.json({ error: "خطا در دریافت ارزیابی" }, { status: 500 });
  }
}

// POST /api/evaluations - Create evaluation
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    if (!EVAL_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "فقط مسئولان و ارزیابان می‌توانند ارزیابی کنند" }, { status: 403 });
    }

    const body = await req.json();
    const { targetType, targetId, scores, overallComment, aiSuggestionId, status } = body;
    if (!targetType || !targetId || !scores) {
      return NextResponse.json({ error: "نوع هدف، شناسه هدف و امتیازات الزامی است" }, { status: 400 });
    }

    const isReport = targetType === "report" || targetType === "REPORT";
    const criteria = await db.evaluationCriteria.findMany({ where: { active: true } });
    const { total, max } = computeTotals(scores, criteria);

    const evaluation = await db.evaluation.create({
      data: {
        targetType, targetId, evaluatorId: user.id,
        scores: JSON.stringify(scores),
        overallComment: overallComment || null,
        aiSuggestionId: aiSuggestionId || null,
        status: status || "FINAL",
      },
    });

    // Update target status
    const targetModel = isReport ? db.dailyReport : db.lessonPlan;
    const target = await targetModel.findUnique({ where: { id: targetId } });
    if (target) {
      await targetModel.update({
        where: { id: targetId },
        data: { evaluatorId: user.id, evaluatedAt: new Date(), status: "APPROVED" },
      });

      // امتیاز + تقدیر خودکار برای ارزیابی ≥ ۸۰٪ (الگوی v23)
      const pct = max > 0 ? total / max : 0;
      if (pct >= 0.8) {
        const amount = isReport ? 15 : 20;
        const desc = isReport ? "گزارش عالی (ارزیابی ≥ ۸۰٪)" : "طرح درس عالی (ارزیابی ≥ ۸۰٪)";
        await awardPoints(target.instructorId, amount, "HIGH_EVALUATION", desc, "EVALUATION", evaluation.id, user.id);
        await db.recognition.create({
          data: {
            userId: target.instructorId,
            branchId: target.branchId,
            level: "SPECIAL",
            title: isReport ? "ارزیابی عالی" : "طرح درس عالی",
            description: desc,
            awardedBy: user.id,
            aiSuggested: false,
          },
        });
        await db.user.update({ where: { id: target.instructorId }, data: { recognitionsCount: { increment: 1 } } });
      } else if (pct > 0) {
        await awardPoints(target.instructorId, Math.round(pct * 20), "HIGH_EVALUATION", `ارزیابی با ${Math.round(pct * 100)}٪`, "EVALUATION", evaluation.id, user.id);
      }
    }

    // Send notification to the instructor about the evaluation
    if (target) {
      const itemTitle = isReport ? (target as any).subject : (target as any).title;
      await notifyUser(
        target.instructorId,
        "evaluation_done",
        `ارزیابی ${isReport ? "گزارش" : "طرح درس"} شما انجام شد`,
        `${user.name} «${itemTitle}» را ارزیابی کرد${overallComment ? `: ${overallComment}` : ""}`,
        { targetType, targetId, evaluationId: evaluation.id }
      );
    }

    return NextResponse.json({ evaluation, totalScore: total, maxScore: max });
  } catch (error) {
    console.error("Create evaluation error:", error);
    return NextResponse.json({ error: "خطا در ثبت ارزیابی" }, { status: 500 });
  }
}
