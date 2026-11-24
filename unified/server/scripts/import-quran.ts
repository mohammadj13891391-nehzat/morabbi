// Import complete Quran data from api.quran.com - simplified, robust version
// Run with: bun run scripts/import-quran.ts [start_surah] [end_surah]

import { db } from "../src/lib/db";

const API_BASE = "https://api.quran.com/api/v4";

const SURAH_NAMES_FA: Record<number, string> = {
  1: "فاتحه", 2: "بقره", 3: "آل عمران", 4: "نساء", 5: "مائده",
  6: "انعام", 7: "اعراف", 8: "انفال", 9: "توبه", 10: "یونس",
  11: "هود", 12: "یوسف", 13: "رعد", 14: "ابراهیم", 15: "حجر",
  16: "نحل", 17: "اسراء", 18: "کهف", 19: "مریم", 20: "طه",
  21: "انبیاء", 22: "حج", 23: "مؤمنون", 24: "نور", 25: "فرقان",
  26: "شعراء", 27: "نمل", 28: "قصص", 29: "عنکبوت", 30: "روم",
  31: "لقمان", 32: "سجده", 33: "احزاب", 34: "سبأ", 35: "فاطر",
  36: "یس", 37: "صافات", 38: "ص", 39: "زمر", 40: "غافر",
  41: "فصلت", 42: "شوری", 43: "زخرف", 44: "دخان", 45: "جاثیه",
  46: "احقاف", 47: "محمد", 48: "فتح", 49: "حجرات", 50: "ق",
  51: "ذاریات", 52: "طور", 53: "نجم", 54: "قمر", 55: "رحمن",
  56: "واقعه", 57: "حدید", 58: "مجادله", 59: "حشر", 60: "ممتحنه",
  61: "صف", 62: "جمعه", 63: "منافقون", 64: "تغابن", 65: "طلاق",
  66: "تحریم", 67: "ملک", 68: "قلم", 69: "حاقه", 70: "معارج",
  71: "نوح", 72: "جن", 73: "مزمل", 74: "مدثر", 75: "قیامت",
  76: "انسان", 77: "مرسلات", 78: "نبأ", 79: "نازعات", 80: "عبس",
  81: "تکویر", 82: "انفطار", 83: "مطففین", 84: "انشقاق", 85: "بروج",
  86: "طارق", 87: "اعلی", 88: "غاشیه", 89: "فجر", 90: "بلد",
  91: "شمس", 92: "لیل", 93: "ضحی", 94: "شرح", 95: "تین",
  96: "علق", 97: "قدر", 98: "بینه", 99: "زلزله", 100: "ادیات",
  101: "قارعه", 102: "تکاثر", 103: "عصر", 104: "همزه", 105: "فیل",
  106: "قریش", 107: "ماعون", 108: "کوثر", 109: "کافرون", 110: "نصر",
  111: "مسد", 112: "اخلاص", 113: "فلق", 114: "ناس",
};

interface ApiVerse {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

async function fetchWithTimeout(url: string, timeoutMs: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchVersesForSurah(surahId: number): Promise<ApiVerse[]> {
  let retries = 0;

  while (retries < 3) {
    try {
      // The API returns all verses of a surah in one call when chapter_number is set
      const url = `${API_BASE}/quran/verses/uthmani?fields=verse_key,text_uthmani&chapter_number=${surahId}`;
      const res = await fetchWithTimeout(url, 30000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.verses || [];
    } catch (err) {
      retries++;
      console.error(`\n    ! خطا در دریافت سوره ${surahId} (تلاش ${retries}/۳): ${err}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return [];
}

async function main() {
  const args = process.argv.slice(2);
  const startSurah = parseInt(args[0] || "1");
  const endSurah = parseInt(args[1] || "114");

  console.log(`\n📖 وارد کردن قرآن از سوره ${startSurah} تا ${endSurah}\n`);

  // If starting from 1, clear existing data
  if (startSurah === 1) {
    console.log("🧹 پاک کردن آیات قبلی...");
    await db.quranVerse.deleteMany({});
    console.log("  ✓\n");
  }

  let totalImported = 0;
  const failedSurahs: number[] = [];

  for (let surahNum = startSurah; surahNum <= endSurah; surahNum++) {
    const surahNameFa = SURAH_NAMES_FA[surahNum] || `سوره ${surahNum}`;

    process.stdout.write(`📖 سوره ${surahNum}: ${surahNameFa} - `);

    try {
      const verses = await fetchVersesForSurah(surahNum);

      if (verses.length === 0) {
        console.log(`⚠️ هیچ آیه‌ای دریافت نشد`);
        failedSurahs.push(surahNum);
        continue;
      }

      // Insert in smaller batches to avoid memory issues
      const batchSize = 25;
      for (let i = 0; i < verses.length; i += batchSize) {
        const batch = verses.slice(i, i + batchSize);
        await db.quranVerse.createMany({
          data: batch.map((v) => {
            const [surahStr, ayahStr] = v.verse_key.split(":");
            return {
              id: parseInt(surahStr) * 1000 + parseInt(ayahStr),
              surah: parseInt(surahStr),
              ayah: parseInt(ayahStr),
              surahName: `Surah-${surahStr}`,
              surahNameFa,
              textSimple: v.text_uthmani,
              textUthmani: v.text_uthmani,
              juz: 1,
              page: 1,
            };
          }),
        });
      }

      totalImported += verses.length;
      console.log(`${verses.length} آیه ✓ (مجموع: ${totalImported})`);

      // Brief delay between surahs
      await new Promise((r) => setTimeout(r, 200));
    } catch (err: any) {
      console.error(`✗ خطا: ${err.message}`);
      failedSurahs.push(surahNum);
    }
  }

  console.log(`\n📊 خلاصه:`);
  console.log(`  ✓ آیات واردشده: ${totalImported}`);
  console.log(`  ✗ سوره‌های ناموفق: ${failedSurahs.length} (${failedSurahs.join(", ")})`);

  if (failedSurahs.length > 0) {
    console.log(`\n💡 برای امتحان مجدد سوره‌های ناموفق:`);
    console.log(`   bun run scripts/import-quran.ts ${failedSurahs[0]} ${failedSurahs[failedSurahs.length - 1]}`);
  }

  const finalCount = await db.quranVerse.count();
  console.log(`\n🔍 تأیید نهایی: ${finalCount} آیه در پایگاه‌داده`);
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
