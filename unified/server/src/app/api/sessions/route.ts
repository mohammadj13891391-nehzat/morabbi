import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { awardPoints, POINT_RULES } from "@/lib/points";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const where: any = (user.role === "INSTRUCTOR" || user.role === "INSTRUCTOR_ASSISTANT")
      ? { instructorId: user.id } : {};
    const sessions = await db.sessionMinutes.findMany({
      where, include: { instructor: { select: { name: true } } },
      orderBy: { createdAt: "desc" }, take: 50,
    });
    return NextResponse.json({ sessions });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.title) return NextResponse.json({ error: "عنوان الزامی است" }, { status: 400 });
    const session = await db.sessionMinutes.create({ data: {
      instructorId: user.id,
      branchId: user.branchId || null,
      title: body.title,
      date: body.date ? new Date(body.date) : new Date(),
      attendees: body.attendees ? Number(body.attendees) : 0,
      place: body.place || null,
      agenda: body.agenda || null,
      decisions: body.decisions || null,
      followup: body.followup || null,
      note: body.note || null,
    }});
    const r = POINT_RULES.SESSION_SAVED;
    await awardPoints(user.id, r.amount, r.reason, r.desc, "SESSION", session.id);
    return NextResponse.json({ session });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });
    await db.sessionMinutes.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
