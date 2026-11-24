import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/analytics - Returns weakness analysis for current user or branch
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "self"; // self | branch | all | maktab
    const maktabId = searchParams.get("maktabId");

    // Determine scope
    let reportWhere: any = {};
    if (scope === "self") {
      reportWhere = { instructorId: user.id };
    } else if (scope === "branch" && user.branchId) {
      reportWhere = { branchId: user.branchId };
    } else if (scope === "maktab" && maktabId) {
      // فیلتر بر اساس مکتب
      const maktabBranchIds = await db.branch.findMany({
        where: { maktabId },
        select: { id: true },
      });
      reportWhere = { branchId: { in: maktabBranchIds.map(b => b.id) } };
    } else if (user.role === "BROTHERS_SKILLS_SUPERVISOR") {
      const boysBranchIds = await db.branch.findMany({
        where: { isBoys: true },
        select: { id: true },
      });
      reportWhere = { branchId: { in: boysBranchIds.map(b => b.id) } };
    } else if (user.role === "SISTERS_SKILLS_SUPERVISOR") {
      const girlsBranchIds = await db.branch.findMany({
        where: { isBoys: false },
        select: { id: true },
      });
      reportWhere = { branchId: { in: girlsBranchIds.map(b => b.id) } };
    }

    // Get all evaluations for the scope
    const reports = await db.dailyReport.findMany({
      where: reportWhere,
      select: { id: true, instructorId: true, subject: true },
    });

    const reportIds = reports.map((r) => r.id);
    const evaluations = await db.evaluation.findMany({
      where: { targetType: "report", targetId: { in: reportIds } },
      select: { scores: true, targetId: true },
    });

    // Also get lesson plan evaluations
    const lessonPlans = await db.lessonPlan.findMany({
      where: reportWhere,
      select: { id: true },
    });
    const lessonPlanIds = lessonPlans.map((l) => l.id);
    const lpEvaluations = await db.evaluation.findMany({
      where: { targetType: "lesson_plan", targetId: { in: lessonPlanIds } },
      select: { scores: true, targetId: true },
    });

    const allEvaluations = [...evaluations, ...lpEvaluations];

    if (allEvaluations.length === 0) {
      return NextResponse.json({
        totalEvaluations: 0,
        criteriaAnalysis: [],
        message: "هنوز ارزیابی‌ای انجام نشده است",
      });
    }

    // Get criteria
    const reportCriteria = await db.evaluationCriteria.findMany({ where: { type: "REPORT" } });
    const lpCriteria = await db.evaluationCriteria.findMany({ where: { type: "LESSON_PLAN" } });
    const allCriteria = [...reportCriteria, ...lpCriteria];

    // Aggregate scores per criterion
    const criterionScores: Record<string, { total: number; count: number; title: string; type: string }> = {};
    for (const c of allCriteria) {
      criterionScores[c.id] = { total: 0, count: 0, title: c.title, type: c.type };
    }

    for (const evalItem of allEvaluations) {
      try {
        const scores = JSON.parse(evalItem.scores || "{}");
        for (const [criterionId, data] of Object.entries(scores) as [string, any][]) {
          if (criterionScores[criterionId]) {
            criterionScores[criterionId].total += data.score || 0;
            criterionScores[criterionId].count += 1;
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    // Calculate averages and identify weaknesses
    const criteriaAnalysis = Object.entries(criterionScores)
      .filter(([_, data]) => data.count > 0)
      .map(([id, data]) => ({
        id,
        title: data.title,
        type: data.type,
        average: data.total / data.count,
        count: data.count,
      }))
      .sort((a, b) => a.average - b.average); // weakest first

    // Identify strengths (top 3) and weaknesses (bottom 3)
    const strengths = criteriaAnalysis.slice(-3).reverse();
    const weaknesses = criteriaAnalysis.slice(0, 3);

    // Overall average
    const overallAvg = criteriaAnalysis.length > 0
      ? criteriaAnalysis.reduce((sum, c) => sum + c.average, 0) / criteriaAnalysis.length
      : 0;

    return NextResponse.json({
      totalEvaluations: allEvaluations.length,
      totalCriteria: criteriaAnalysis.length,
      overallAverage: overallAvg,
      strengths,
      weaknesses,
      criteriaAnalysis,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "خطا در تحلیل" }, { status: 500 });
  }
}
