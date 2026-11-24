import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    if (!["BRANCH_MANAGER", "SUPERVISOR", "EVALUATOR", "BROTHERS_SKILLS_SUPERVISOR", "SISTERS_SKILLS_SUPERVISOR", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    const where: any = { approvalStatus: "PENDING" };
    if (user.role === "BRANCH_MANAGER") where.OR = [{ branchId: user.branchId }, { branchId: null }];
    const pendingUsers = await db.user.findMany({ where, select: { id: true, name: true, nationalId: true, phone: true, requestedRole: true, branchId: true, branch: { select: { name: true } }, createdAt: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ pendingUsers });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
