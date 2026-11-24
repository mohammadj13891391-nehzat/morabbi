import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try { const branches = await db.branch.findMany({ select: { id: true, name: true, code: true, isBoys: true, maktabId: true, maktab: { select: { name: true } } }, orderBy: { name: "asc" } }); return NextResponse.json({ branches }); }
  catch { return NextResponse.json({ branches: [] }); }
}
