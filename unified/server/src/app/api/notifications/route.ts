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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    if (status) where.status = status;
    const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
    const unreadCount = await db.notification.count({ where: { userId: user.id, read: false } });
    return NextResponse.json({ notifications, unreadCount });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    await db.notification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
