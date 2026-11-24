import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import bcrypt from "bcryptjs";
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "رمز فعلی و جدید الزامی است" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "رمز جدید باید حداقل ۶ کاراکتر باشد" }, { status: 400 });
    const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!record) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    let valid = record.passwordHash?.startsWith("$2") ? await bcrypt.compare(currentPassword, record.passwordHash) : record.passwordHash === currentPassword;
    if (!valid) return NextResponse.json({ error: "رمز فعلی نادرست است" }, { status: 401 });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
