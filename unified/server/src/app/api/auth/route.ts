import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, loginByPhone, destroySession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) return NextResponse.json({ error: "شماره تلفن و رمز عبور الزامی است" }, { status: 400 });
    const result = await loginByPhone(phone, password);
    if (!result) return NextResponse.json({ error: "شماره تلفن یا رمز عبور نادرست است" }, { status: 401 });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json({ user: result.user, token: result.token });
  } catch { return NextResponse.json({ error: "خطای سرور" }, { status: 500 }); }
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req as unknown as Request);
  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest) {
  try { const token = req.headers.get("x-user-id"); if (token && token.length === 64) await destroySession(token); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
