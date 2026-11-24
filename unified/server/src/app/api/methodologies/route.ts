import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const methodologies = await db.methodology.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ methodologies });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
