import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/analytics/charts - Data for charts
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const reportWhere: any = { createdAt: { gte: sixMonthsAgo } };
    if (user.role === "INSTRUCTOR") reportWhere.instructorId = user.id;
    else if (user.role === "BRANCH_MANAGER") reportWhere.branchId = user.branchId;

    const allReports = await db.dailyReport.findMany({
      where: reportWhere, select: { status: true, createdAt: true, branchId: true },
    });

    const monthNames = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
    const monthlyTrend: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mr = allReports.filter(r => { const rd = new Date(r.createdAt); return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear(); });
      monthlyTrend.push({ month: `${monthNames[d.getMonth()]}`, total: mr.length, approved: mr.filter(r => r.status === "APPROVED").length, pending: mr.filter(r => r.status === "SUBMITTED").length });
    }

    const statusDistribution = {
      DRAFT: allReports.filter(r => r.status === "DRAFT").length,
      SUBMITTED: allReports.filter(r => r.status === "SUBMITTED").length,
      APPROVED: allReports.filter(r => r.status === "APPROVED").length,
      RETURNED: allReports.filter(r => r.status === "RETURNED").length,
    };

    const maktabs = await db.maktab.findMany({ select: { id: true, name: true } });
    const maktabComparison: any[] = [];
    for (const m of maktabs) {
      const branches = await db.branch.findMany({ where: { maktabId: m.id }, select: { id: true } });
      const count = allReports.filter(r => branches.some(b => b.id === r.branchId)).length;
      maktabComparison.push({ name: m.name.replace("مکتب ",""), count });
    }

    let topPerformers: any[] = [];
    if (["SUPERVISOR","ADMIN","BRANCH_MANAGER","BROTHERS_SKILLS_SUPERVISOR","SISTERS_SKILLS_SUPERVISOR"].includes(user.role)) {
      topPerformers = await db.user.findMany({
        where: { role: "INSTRUCTOR", active: true },
        select: { id: true, name: true, totalPoints: true, recognitionsCount: true },
        orderBy: { totalPoints: "desc" }, take: 5,
      });
    }

    return NextResponse.json({ monthlyTrend, statusDistribution, maktabComparison, topPerformers });
  } catch (error) {
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}
