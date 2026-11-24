import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const surah = searchParams.get("surah");
    if (!q && !surah) return NextResponse.json({ verses: [] });
    let where: any = {};
    if (surah) {
      const surahNum = parseInt(surah);
      const ayah = searchParams.get("ayah");
      where = ayah ? { surah: surahNum, ayah: parseInt(ayah) } : { surah: surahNum };
    } else {
      const direct = await db.quranVerse.findMany({ where: { OR: [{ textSimple: { contains: q } }, { textUthmani: { contains: q } }] }, take: 20 });
      if (direct.length > 0) return NextResponse.json({ verses: direct });
      // Normalized search
      const all = await db.quranVerse.findMany({ take: 500 });
      const norm = (t: string) => t.replace(/[\u0670\u0671\u0672\u0673\u0622\u0623\u0625]/g, "\u0627").replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "").replace(/\u0640/g, "").trim();
      const nq = norm(q);
      const filtered = all.filter(v => norm(v.textSimple).includes(nq) || norm(v.textUthmani).includes(nq)).slice(0, 20);
      return NextResponse.json({ verses: filtered });
    }
    const verses = await db.quranVerse.findMany({ where, take: 20 });
    return NextResponse.json({ verses });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
