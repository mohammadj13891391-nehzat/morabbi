import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/assistant - AI Assistant for instructors
// Body: { message, context? }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "پیام خالی است" }, { status: 400 });
    }

    // Search Quran for relevant verses
    const quranResults = await searchQuran(message);
    
    // Search hadiths for relevant narrations
    const hadithResults = await searchHadiths(message);

    // Build context for the AI
    const context = `
شما دستیار هوشمند سامانه «نهضت تربیتی حضرت سیدالشهدا علیه‌السلام» هستید.

# وظایف شما:
۱. پاسخ به سؤالات مربیان درباره گزارش‌نویسی و طرح‌درس‌نویسی
۲. راهنمایی بر اساس اسناد نهضت (اصول و روش گزارش‌نویسی + اصول و روش طرح‌درس‌نویسی)
۳. جستجو و ارجاع به آیات قرآن و روایات معتبر شیعی
۴. کمک به بهبود کیفیت گزارش‌ها و طرح‌درس‌ها
۵. پاسخ به سؤالات تربیتی و آموزشی

# ساختار گزارش (طبق سند نهضت):
- عنوان، چکیده، بدنه (تقسیم‌بندی موضوعات)، توصیه‌ها
- الگو: تقدّم زمانی، قیاسی، استقرایی
- سبک: توصیفی، تحلیلی، انتقادی، تجویزی
- اصول: دقت محتوایی، ظاهر حرفه‌ای، بهره‌وری، ثبات ساختار، کاربردی بودن

# ساختار طرح درس (طبق سند نهضت):
- عنوان و عناوین فرعی
- هدف کلی، اهداف جزئی، اهداف رفتاری (با عملکرد، شرایط، معیار)
- پیش‌نیازها، ارزشیابی تشخیصی
- مراحل تدریس: آمادگی، معرفی، ارائه، خلاصه، ارزشیابی، تکمیلی
- روش تدریس، وسایل آموزشی، سؤال‌های ارزشیابی

# اطلاعات کاربر:
- نام: ${user.name}
- نقش: ${user.role}

# آیات قرآن مرتبط با سؤال کاربر:
${quranResults}

# روایات مرتبط با سؤال کاربر:
${hadithResults}
`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: context },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || "متأسفانه پاسخی دریافت نشد.";

    return NextResponse.json({
      response,
      sources: {
        quran: quranResults.includes("یافت نشد") ? [] : quranResults,
        hadith: hadithResults.includes("یافت نشد") ? [] : hadithResults,
      },
    });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json({ error: "خطا در دستیار هوشمند" }, { status: 500 });
  }
}

// Search Quran for relevant verses
async function searchQuran(query: string): Promise<string> {
  try {
    // Extract keywords from the query
    const keywords = query.match(/[\u0621-\u064A]+/g)?.slice(0, 3) || [];
    if (keywords.length === 0) return "کلیدواژه‌ای برای جستجوی قرآن یافت نشد.";

    for (const keyword of keywords) {
      if (keyword.length < 3) continue;
      const verses = await db.quranVerse.findMany({
        where: {
          OR: [
            { textSimple: { contains: keyword } },
            { textUthmani: { contains: keyword } },
          ],
        },
        take: 3,
      });

      if (verses.length > 0) {
        return verses.map(v =>
          `سوره ${v.surahNameFa} ${v.surah}:${v.ayah} — ${v.textUthmani}`
        ).join("\n");
      }
    }
    return "آیه مرتبطی یافت نشد.";
  } catch {
    return "جستجوی قرآن در دسترس نیست.";
  }
}

// Search hadiths
async function searchHadiths(query: string): Promise<string> {
  try {
    const keywords = query.match(/[\u0621-\u064A]+/g)?.slice(0, 3) || [];
    if (keywords.length === 0) return "کلیدواژه‌ای یافت نشد.";

    for (const keyword of keywords) {
      if (keyword.length < 3) continue;
      const hadiths = await db.hadith.findMany({
        where: {
          OR: [
            { textAr: { contains: keyword } },
            { textFa: { contains: keyword } },
          ],
        },
        take: 3,
      });

      if (hadiths.length > 0) {
        return hadiths.map(h =>
          `${h.source} — درجه: ${h.grade || "نامشخص"}\n${h.textAr}\nترجمه: ${h.textFa || "—"}`
        ).join("\n---\n");
      }
    }
    return "روایت مرتبطی یافت نشد.";
  } catch {
    return "جستجوی روایات در دسترس نیست.";
  }
}
