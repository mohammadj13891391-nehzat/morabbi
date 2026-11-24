import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const where: any = date ? { date } : {};
    const records = await db.attendanceRecord.findMany({
      where, include: { person: { select: { id: true, name: true, group: true } } },
      orderBy: { createdAt: "desc" }, take: 200,
    });
    return NextResponse.json({ records });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.personId || !body.date) return NextResponse.json({ error: "personId و date لازم است" }, { status: 400 });
    const record = await db.attendanceRecord.upsert({
      where: { personId_date: { personId: body.personId, date: body.date } },
      update: { status: body.status, markedBy: user.id },
      create: { personId: body.personId, date: body.date, status: body.status || "PRESENT", markedBy: user.id },
    });
    return NextResponse.json({ record });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });
    await db.attendanceRecord.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
