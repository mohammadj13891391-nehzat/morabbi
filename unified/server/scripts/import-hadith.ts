// Script to import Shia hadith data from a JSON file into the database
// Usage: bun run scripts/import-hadith.ts <input-json-file>
// Example: bun run scripts/import-hadith.ts /tmp/hadith-data.json
//
// JSON format expected:
// [
//   {
//     "source": "الکافی",
//     "volume": 1,
//     "chapter": "کتاب العقل و العلم",
//     "narratorChain": "...",
//     "grade": "صحیح",
//     "textAr": "...",
//     "textFa": "...",
//     "subjectTags": ["علم", "آموزش"]
//   },
//   ...
// ]

import { db } from "../src/lib/db";
import { readFileSync } from "fs";

interface HadithInput {
  source: string;
  volume?: number;
  chapter?: string;
  narratorChain?: string;
  grade?: string;
  textAr: string;
  textFa?: string;
  subjectTags?: string[];
}

async function main() {
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.error("❌ استفاده: bun run scripts/import-hadith.ts <input-json-file>");
    console.log("\n📝 فرمت JSON مورد انتظار:");
    console.log(JSON.stringify([
      {
        source: "الکافی",
        volume: 1,
        chapter: "کتاب العقل و العلم",
        narratorChain: "...",
        grade: "صحیح",
        textAr: "...",
        textFa: "...",
        subjectTags: ["علم", "آموزش"]
      }
    ], null, 2));
    process.exit(1);
  }

  console.log(`📖 خواندن فایل: ${inputFile}\n`);

  let hadiths: HadithInput[];
  try {
    const content = readFileSync(inputFile, "utf-8");
    hadiths = JSON.parse(content);
  } catch (err: any) {
    console.error(`❌ خطا در خواندن فایل: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(hadiths) || hadiths.length === 0) {
    console.error("❌ فایل JSON خالی است یا ساختار درستی ندارد");
    process.exit(1);
  }

  console.log(`📊 تعداد روایات: ${hadiths.length}\n`);

  // Clear existing hadiths (optional, comment out to keep existing)
  console.log("🧹 پاک کردن روایات قبلی...");
  await db.hadith.deleteMany({});
  console.log("  ✓\n");

  let imported = 0;
  let failed = 0;

  for (let i = 0; i < hadiths.length; i++) {
    const h = hadiths[i];

    if (!h.source || !h.textAr) {
      console.warn(`  ⚠️ روایت ${i + 1}: ناقص (source یا textAr ندارد)`);
      failed++;
      continue;
    }

    try {
      await db.hadith.create({
        data: {
          source: h.source,
          volume: h.volume || null,
          chapter: h.chapter || null,
          narratorChain: h.narratorChain || null,
          grade: h.grade || null,
          textAr: h.textAr,
          textFa: h.textFa || null,
          subjectTags: JSON.stringify(h.subjectTags || []),
        },
      });
      imported++;
      if (imported % 100 === 0) {
        console.log(`  ✓ ${imported} روایت وارد شد`);
      }
    } catch (err: any) {
      console.error(`  ✗ روایت ${i + 1}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 خلاصه:`);
  console.log(`  ✓ وارد شده: ${imported}`);
  console.log(`  ✗ ناموفق: ${failed}`);

  const count = await db.hadith.count();
  console.log(`\n🔍 تأیید: ${count} روایت در پایگاه‌داده`);

  // Stats by source
  const stats = await db.hadith.groupBy({
    by: ["source"],
    _count: { source: true },
  });
  console.log(`\n📈 آمار بر اساس منبع:`);
  for (const s of stats) {
    console.log(`  • ${s.source}: ${s._count.source} روایت`);
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
