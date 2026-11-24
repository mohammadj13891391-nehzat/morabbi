import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { awardPoints, POINT_RULES } from "@/lib/points";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const tasks = await db.task.findMany({ where: { userId: user.id }, orderBy: [{ done: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json({ tasks });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.text) return NextResponse.json({ error: "متن کار لازم است" }, { status: 400 });
    const task = await db.task.create({ data: {
      userId: user.id, text: body.text,
      priority: body.priority || "MED",
      due: body.due ? new Date(body.due) : null,
      done: false,
    }});
    return NextResponse.json({ task });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });
    const existing = await db.task.findFirst({ where: { id: body.id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "پیدا نشد" }, { status: 404 });
    const task = await db.task.update({ where: { id: body.id }, data: {
      text: body.text !== undefined ? body.text : existing.text,
      priority: body.priority || existing.priority,
      due: body.due ? new Date(body.due) : (body.due === null ? null : existing.due),
      done: body.done !== undefined ? !!body.done : existing.done,
    }});
    if (task.done && !existing.done) {
      const r = POINT_RULES.TASK_COMPLETED;
      await awardPoints(user.id, r.amount, r.reason, r.desc, "TASK", task.id);
    }
    return NextResponse.json({ task });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });
    await db.task.deleteMany({ where: { id: body.id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
