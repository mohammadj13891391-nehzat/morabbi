import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const ADMINISH = ["ADMIN", "SUPERVISOR", "BRANCH_MANAGER"];

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const where: any = ADMINISH.includes(user.role) ? {} : { branchId: user.branchId };
    const people = await db.person.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ people });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "نام الزامی است" }, { status: 400 });
    const person = await db.person.create({ data: {
      name: body.name,
      nationalId: body.nationalId || null,
      age: body.age ? Number(body.age) : null,
      phone: body.phone || null,
      grade: body.grade || null,
      group: body.group || "",
      joinDate: body.joinDate ? new Date(body.joinDate) : null,
      note: body.note || null,
      branchId: user.branchId,
      createdBy: user.id,
    }});
    return NextResponse.json({ person });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });
    const person = await db.person.update({ where: { id: body.id }, data: {
      name: body.name,
      nationalId: body.nationalId || null,
      age: body.age ? Number(body.age) : null,
      phone: body.phone || null,
      grade: body.grade || null,
      group: body.group || "",
      joinDate: body.joinDate ? new Date(body.joinDate) : null,
      note: body.note || null,
    }});
    return NextResponse.json({ person });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });
    await db.person.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
