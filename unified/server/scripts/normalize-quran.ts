// Update textSimple column with diacritics-stripped version for fast searching
// Run with: bun run scripts/normalize-quran.ts

import { db } from "../src/lib/db";

function stripDiacritics(text: string): string {
  return text
    // IMPORTANT: First normalize superscript alef (U+0670) and alef wasla (U+0671) to regular alef
    .replace(/[\u0670\u0671\u0672\u0673\u0622\u0623\u0625]/g, "\u0627")
    // Remove harakat (diacritics)
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u08D3-\u08FF]/g, "")
    // Remove tatweel (kashida)
    .replace(/\u0640/g, "")
    // Normalize ya and alef maqsura
    .replace(/[\u0649\u064A]/g, "\u064A")
    // Normalize tah marbuta to ha
    .replace(/\u0629/g, "\u0647")
    // Remove non-Arabic letter characters
    .replace(/[^\u0621-\u064A\s]/g, "")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("🔧 نرمال‌سازی متن آیات برای جستجوی سریع...\n");

  const total = await db.quranVerse.count();
  console.log(`📊 کل آیات: ${total}\n`);

  const batchSize = 100;
  let processed = 0;

  for (let skip = 0; skip < total; skip += batchSize) {
    const verses = await db.quranVerse.findMany({
      skip,
      take: batchSize,
      orderBy: { id: "asc" },
      select: { id: true, textUthmani: true },
    });

    for (const v of verses) {
      const normalized = stripDiacritics(v.textUthmani);
      if (normalized !== v.textUthmani) {
        await db.quranVerse.update({
          where: { id: v.id },
          data: { textSimple: normalized },
        });
      }
    }

    processed += verses.length;
    if (processed % 500 === 0 || processed === total) {
      console.log(`  ✓ پردازش‌شده: ${processed}/${total}`);
    }
  }

  console.log(`\n✅ نرمال‌سازی کامل شد`);

  // Test
  const test = await db.quranVerse.findUnique({ where: { id: 56 * 1000 + 10 } });
  if (test) {
    console.log(`\n📝 تست آیه ۵۶:۱۰:`);
    console.log(`   Uthmani: ${test.textUthmani}`);
    console.log(`   Simple:  ${test.textSimple}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
