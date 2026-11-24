import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { awardPoints, POINT_RULES } from "@/lib/points";

const ITEMS = ["salatFajr","salatZuhr","salatAsr","salatMagrib","salatIsha","quran","dhikrMorning","dhikrEvening","fasting","study"] as const;

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const items = await db.dailyTracker.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 14 });
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    const body = await req.json();
    const date = body.date || new Date().toLocaleDateString("fa-IR");
    const existing = await db.dailyTracker.findUnique({ where: { userId_date: { userId: user.id, date } } });
    const data: any = {};
    let newlyChecked = 0;
    for (const k of ITEMS) {
      const v = !!body[k];
      data[k] = v;
      if (v && existing && !existing[k]) newlyChecked++;
    }
    const rec = await db.dailyTracker.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: data,
      create: { userId: user.id, date, ...data },
    });
    if (newlyChecked > 0) {
      const r = POINT_RULES.TRACKER_ITEM;
      await awardPoints(user.id, r.amount * newlyChecked, r.reason, `${newlyChecked} مورد برنامه روزانه`, "TRACKER", rec.id);
    }
    return NextResponse.json({ item: rec });
  } catch { return NextResponse.json({ error: "خطا" }, { status: 500 }); }
}
