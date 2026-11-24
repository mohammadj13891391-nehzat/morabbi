import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const where: any = {};
    if (user.role === "INSTRUCTOR" || user.role === "INSTRUCTOR_ASSISTANT") where.instructorId = user.id;
    else if (user.role === "BRANCH_MANAGER") where.branchId = user.branchId;
    const totalReports = await db.dailyReport.count({ where });
    const pendingReports = await db.dailyReport.count({ where: { ...where, status: "SUBMITTED" } });
    const approvedReports = await db.dailyReport.count({ where: { ...where, status: "APPROVED" } });
    const recentReports = await db.dailyReport.findMany({ where, include: { instructor: { select: { name: true } }, branch: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 });
    const topWhere: any = { role: "INSTRUCTOR", active: true };
    if (user.role === "BRANCH_MANAGER") topWhere.branchId = user.branchId;
    const topPerformers = await db.user.findMany({ where: topWhere, select: { id: true, name: true, totalPoints: true, recognitionsCount: true, branch: { select: { name: true } } }, orderBy: { totalPoints: "desc" }, take: 5 });
    const recentRecognitions = await db.recognition.findMany({ where: user.role === "BRANCH_MANAGER" ? { branchId: user.branchId } : {}, include: { user: { select: { name: true } }, branch: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 });
    let branchStats: any[] = [];
    if (user.role === "SUPERVISOR" || user.role === "ADMIN") {
      const branches = await db.branch.findMany({ include: { _count: { select: { reports: true, users: true } } } });
      branchStats = branches.map(b => ({ id: b.id, name: b.name, code: b.code, totalReports: b._count.reports, totalInstructors: b._count.users }));
    }
    return NextResponse.json({ stats: { totalReports, pendingReports, approvedReports, userPoints: user.totalPoints, userRecognitions: user.recognitionsCount }, recentReports, branchStats, topPerformers, recentRecognitions });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
