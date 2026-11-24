import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/analytics/instructors - Compare instructors within a branch/maktab
// ?branchId=xxx or &maktabId=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    if (!["SUPERVISOR","ADMIN","BRANCH_MANAGER","BROTHERS_SKILLS_SUPERVISOR","SISTERS_SKILLS_SUPERVISOR","EVALUATOR"].includes(user.role)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const maktabId = searchParams.get("maktabId");

    let branchFilter: any = {};
    if (branchId) branchFilter = { branchId };
    else if (maktabId) {
      const maktabBranches = await db.branch.findMany({ where: { maktabId }, select: { id: true } });
      branchFilter = { branchId: { in: maktabBranches.map(b => b.id) } };
    } else if (user.role === "BRANCH_MANAGER") branchFilter = { branchId: user.branchId };
    else if (user.role === "BROTHERS_SKILLS_SUPERVISOR") {
      const boys = await db.branch.findMany({ where: { isBoys: true }, select: { id: true } });
      branchFilter = { branchId: { in: boys.map(b => b.id) } };
    } else if (user.role === "SISTERS_SKILLS_SUPERVISOR") {
      const girls = await db.branch.findMany({ where: { isBoys: false }, select: { id: true } });
      branchFilter = { branchId: { in: girls.map(b => b.id) } };
    }

    const instructors = await db.user.findMany({
      where: { ...branchFilter, role: "INSTRUCTOR", active: true, approvalStatus: "APPROVED" },
      select: {
        id: true, name: true, totalPoints: true, recognitionsCount: true,
        branch: { select: { name: true } },
        _count: { select: { reportsAuthored: true, lessonPlansAuthored: true } },
      },
      orderBy: { totalPoints: "desc" },
    });

    // Get average evaluation scores for each instructor
    const instructorsWithStats = await Promise.all(
      instructors.map(async (inst) => {
        const reports = await db.dailyReport.findMany({
          where: { instructorId: inst.id },
          select: { id: true },
        });
        const reportIds = reports.map(r => r.id);
        const evaluations = await db.evaluation.findMany({
          where: { targetType: "report", targetId: { in: reportIds } },
          select: { scores: true },
        });

        let avgScore = 0;
        let evalCount = evaluations.length;
        if (evalCount > 0) {
          const allScores: number[] = [];
          evaluations.forEach(e => {
            try {
              const scores = JSON.parse(e.scores || "{}");
              Object.values(scores).forEach((s: any) => allScores.push(s.score || 0));
            } catch {}
          });
          avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        }

        return {
          ...inst,
          avgScore: avgScore.toFixed(1),
          evalCount,
          reportCount: inst._count.reportsAuthored,
          lessonPlanCount: inst._count.lessonPlansAuthored,
        };
      })
    );

    return NextResponse.json({ instructors: instructorsWithStats });
  } catch (error) {
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}
