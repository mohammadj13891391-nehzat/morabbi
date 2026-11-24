import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const hadiths = await db.hadith.findMany({ take: 30, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ hadiths });
  } catch { return NextResponse.json({ hadiths: [] }); }
}
