import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    if (!["BRANCH_MANAGER", "SUPERVISOR", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    const { userId, action, role, branchId } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "شناسه و عملیات الزامی است" }, { status: 400 });
    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    if ((target as any).approvalStatus !== "PENDING") return NextResponse.json({ error: "قبلاً پردازش شده" }, { status: 400 });
    if (action === "approve") {
      await db.user.update({ where: { id: userId }, data: { role: (role || target.requestedRole) as any, branchId: branchId !== undefined ? branchId : target.branchId, approvalStatus: "APPROVED", approvedBy: user.id, approvedAt: new Date(), active: true } });
      return NextResponse.json({ success: true, message: "تأیید شد" });
    } else if (action === "reject") {
      await db.user.update({ where: { id: userId }, data: { approvalStatus: "REJECTED", approvedBy: user.id, approvedAt: new Date(), active: false } });
      return NextResponse.json({ success: true, message: "رد شد" });
    }
    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
