import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/hadith/search            → latest 30 (used by the PWA sync pull)
// GET /api/hadith/search?q=keyword  → real search over text/textFa/source/chapter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      const hadiths = await db.hadith.findMany({ take: 30, orderBy: { createdAt: "desc" } });
      return NextResponse.json({ hadiths });
    }

    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    const hadiths = await db.hadith.findMany({
      where: {
        OR: [
          { textAr: { contains: q } },
          { textFa: { contains: q } },
          { source: { contains: q } },
          { chapter: { contains: q } },
        ],
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ hadiths, count: hadiths.length });
  } catch {
    return NextResponse.json({ hadiths: [] });
  }
}
