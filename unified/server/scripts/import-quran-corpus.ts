// Import the FULL Quran (6236 verses) from the local Quranic Arabic Corpus dataset.
// Source: E:\corpus.quran.com\parsed\chNNN.json  (CC-BY-SA-4.0, corpus.quran.com)
// Run:    node --experimental-strip-types scripts/import-quran-corpus.ts

import { db } from "../src/lib/db.ts";
import { readFileSync } from "fs";
import path from "path";

const CORPUS_DIR = "E:/corpus.quran.com/parsed";

// 114 Persian (Farsi) surah names — index 0 == surah 1
const SURAH_FA = [
  "فاتحه","بقره","آل عمران","نساء","مائده","انعام","اعراف","انفال","توبه","یونس",
  "هود","یوسف","رعد","ابراهیم","حجر","نحل","اسراء","کهف","مریم","طه",
  "انبیاء","حج","مؤمنون","نور","فرقان","شعراء","نمل","قمر","عنکبوت","روم",
  "لقمان","سجد","احزاب","سبأ","فاطر","یس","ص","زمر","غافر","فصلت",
  "شوری","زخرف","دخان","جاثیه","احقاف","محمد","فتح","حجرات","ق","زلزله",
  "طور","نجم","قمر","رحمان","واقعه","حدید","مجادله","حشر","ممتحنه","صف",
  "جمعه","منافقون","تلاق","طلاق","تحریم","ملک","قلم","حاقه","معارج","نوح",
  "جن","مؤمنون","مزمل","مدثر","قیامت","انسان","مؤمنون","نبأ","نازعات","عبس",
  "توکر","انفطار","مطففین","انشقاق","بروج","طارق","اعلی","غاشیه","فجار","بلد",
  "شمس","لیل","ضحی","شرح","تین","علق","قمر","بیّنه","زلزله","عادیّات",
  "قارعه","تکاثر","عصر","حومره","فیل","قریش","ماعون","کوثر","کافرون","نصر",
  "مسد","اخلاص","فلق","ناس",
];

// 30-juz start points (surah, ayah) — standard mushaf juz boundaries
const JUZ_STARTS: [number, number][] = [
  [1,1],[2,142],[2,253],[3,92],[4,24],[4,147],[5,81],[6,110],[7,87],[8,40],
  [9,92],[11,5],[12,52],[15,1],[17,1],[18,74],[21,1],[23,1],[25,20],[27,55],
  [29,45],[33,30],[36,27],[39,31],[41,46],[46,1],[51,30],[58,1],[67,1],[78,1],
];

function stripDiacritics(s: string): string {
  return s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "");
}
function faName(n: number): string { return SURAH_FA[n - 1] || ""; }
function juzOf(surah: number, ayah: number): number {
  let juz = 1;
  for (let j = 0; j < JUZ_STARTS.length; j++) {
    const [js, ja] = JUZ_STARTS[j];
    if (surah > js || (surah === js && ayah >= ja)) juz = j + 1;
  }
  return juz;
}

async function main() {
  let globalId = 0;
  const rows: any[] = [];
  let skipped = 0;

  for (let s = 1; s <= 114; s++) {
    const file = path.join(CORPUS_DIR, `ch${String(s).padStart(3, "0")}.json`);
    const data = JSON.parse(readFileSync(file, "utf8"));
    const nameEn = data.nameEn || `Surah ${s}`;
    const nameFa = faName(s);
    for (const v of data.verses || []) {
      const uthmani = String(v.text || "").replace(/\s+/g, " ").trim();
      if (!uthmani) { skipped++; continue; }
      globalId++;
      rows.push({
        id: globalId,
        surah: s,
        ayah: v.verse,
        surahName: nameEn,
        surahNameFa: nameFa,
        textSimple: stripDiacritics(uthmani),
        textUthmani: uthmani,
        juz: juzOf(s, v.verse),
        page: 0,
      });
    }
    process.stdout.write(`\r  surah ${s}/114 (${nameEn}) — ${globalId} verses`);
  }

  console.log(`\nParsed ${rows.length} verses (global id max ${globalId}, skipped empty ${skipped})`);
  console.log("Wiping existing quran_verses ...");
  await db.quranVerse.deleteMany({});

  let inserted = 0;
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const r = await db.quranVerse.createMany({ data: rows.slice(i, i + BATCH) });
    inserted += r.count;
  }
  const final = await db.quranVerse.count();
  console.log(`Inserted ${inserted} QuranVerse rows (DB total: ${final})`);
}

main()
  .catch((e) => { console.error("\nQuran corpus import error:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
