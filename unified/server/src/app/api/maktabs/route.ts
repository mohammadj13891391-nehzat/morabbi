import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try { const maktabs = await db.maktab.findMany({ where: { active: true }, orderBy: { name: "asc" } }); return NextResponse.json({ maktabs }); }
  catch { return NextResponse.json({ maktabs: [] }); }
}
