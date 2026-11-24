import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { nationalId, phone, requestedRole, name, branchId, maktabId } = await req.json();
    if (!nationalId || !phone || !requestedRole || !name) return NextResponse.json({ error: "کد ملی، تلفن، نقش و نام الزامی است" }, { status: 400 });
    if (!/^\d{10}$/.test(nationalId)) return NextResponse.json({ error: "کد ملی باید ۱۰ رقم باشد" }, { status: 400 });
    if (!/^09\d{9}$/.test(phone)) return NextResponse.json({ error: "شماره تلفن باید با ۰۹ شروع شود" }, { status: 400 });
    const existing = await db.user.findFirst({ where: { OR: [{ phone }, { nationalId }] } });
    if (existing) {
      if ((existing as any).approvalStatus === "PENDING") return NextResponse.json({ error: "ثبت‌نام در انتظار تأیید است" }, { status: 409 });
      return NextResponse.json({ error: "این کد ملی یا تلفن قبلاً ثبت شده است" }, { status: 409 });
    }
    const generatedPassword = nationalId.slice(-6);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(generatedPassword, salt);
    const approvedCount = await db.user.count({ where: { approvalStatus: "APPROVED" } });
    const isBootstrap = approvedCount === 0;
    const user = await db.user.create({ data: { name, nationalId, phone, passwordHash, role: isBootstrap ? "SUPERVISOR" : "INSTRUCTOR", requestedRole: (requestedRole as any) || "INSTRUCTOR", branchId: branchId || null, maktabId: maktabId || null, approvalStatus: isBootstrap ? "APPROVED" : "PENDING", active: isBootstrap, approvedAt: isBootstrap ? new Date() : null } });
    if (isBootstrap) return NextResponse.json({ success: true, message: "ثبت‌نام موفق. شما اولین کاربر هستید — تأیید خودکار.", userId: user.id, status: "APPROVED", isBootstrap: true, loginPassword: generatedPassword });
    return NextResponse.json({ success: true, message: "ثبت‌نام موفق. پس از تأیید مسئول وارد شوید.", userId: user.id, status: "PENDING", loginPassword: generatedPassword });
  } catch { return NextResponse.json({ error: "خطا در ثبت‌نام" }, { status: 500 }); }
}
