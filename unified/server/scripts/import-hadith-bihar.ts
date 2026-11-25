// Import structured hadith data from the local Bihar al-Anwar volume dumps.
// Source: E:\بحارالانوار\New folder\<bookId> <title>\volK.txt (+ _meta.txt)
// Each volume file → one Hadith record (source/volume/chapter/subjectTags + full Arabic text).
// Run:    node --experimental-strip-types scripts/import-hadith-bihar.ts

import { db } from "../src/lib/db.ts";
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

const ROOT = "E:/بحارالانوار/New folder";

// Strip OCR artifacts, page markers, image placeholders, and header comment lines.
function cleanBody(raw: string): string {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (/^#/.test(l)) return false;            // header comment lines
      if (/^\[p\d+\]$/.test(l)) return false;    // page markers
      if (/^\[image page\]/i.test(l)) return false; // image placeholders
      if (/^\/images\//.test(l)) return false;   // image paths
      return true;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

interface Vol {
  bookId: string;
  title: string;
  volume: number;
  totalVolumes: number;
  textAr: string;
}

async function main() {
  if (!existsSync(ROOT)) { console.error(`Source not found: ${ROOT}`); process.exit(1); }

  const bookDirs = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory());
  const vols: Vol[] = [];
  let parseErrors = 0;

  for (const dir of bookDirs) {
    const bookPath = path.join(ROOT, dir.name);
    // Book id = leading digits of the directory name; title = the rest
    const m = dir.name.match(/^(\d+)\s*(.*)$/);
    const bookId = m ? m[1] : dir.name;
    let title = m ? (m[2] || "").trim() : dir.name;

    // Prefer the authoritative title from _meta.txt if present
    const metaPath = path.join(bookPath, "_meta.txt");
    if (existsSync(metaPath)) {
      try {
        const meta = readFileSync(metaPath, "utf8");
        const tm = meta.match(/Title:\s*(.+)/);
        if (tm && tm[1].trim()) title = tm[1].trim();
      } catch { /* ignore meta errors */ }
    }

    const volFiles = readdirSync(bookPath, { withFileTypes: true })
      .map((f) => f.name)
      .filter((n) => /^vol\d+\.txt$/.test(n))
      .sort((a, b) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10));

    let totalVolumes = volFiles.length;

    for (const vf of volFiles) {
      const volNum = parseInt(vf.replace(/\D/g, ""), 10);
      try {
        const raw = readFileSync(path.join(bookPath, vf), "utf8");
        const textAr = cleanBody(raw);
        if (!textAr) { parseErrors++; continue; }
        vols.push({ bookId, title, volume: volNum, totalVolumes, textAr });
      } catch (e: any) { parseErrors++; console.error(`  read error ${dir.name}/${vf}: ${e.message}`); }
    }
    console.log(`  book ${bookId} «${title}» — ${volFiles.length} volumes`);
  }

  console.log(`\nParsed ${vols.length} volume records (parse errors: ${parseErrors})`);

  // Idempotent: wipe only previously-imported Bihar books (by their exact source title),
  // preserving the hand-picked kütüb-arba'ah hadiths (different source names).
  const titles = Array.from(new Set(vols.map((v) => v.title)));
  const wiped = await db.hadith.deleteMany({ where: { source: { in: titles } } });
  console.log(`Cleared ${wiped.count} previously-imported Bihar records`);

  let inserted = 0;
  for (const v of vols) {
    await db.hadith.create({
      data: {
        source: v.title,
        volume: v.volume,
        chapter: `${v.title} (جلد ${v.volume})`,
        narratorChain: null,
        grade: null,
        textAr: v.textAr,
        textFa: null,
        subjectTags: JSON.stringify([v.title]),
      },
    });
    inserted++;
  }

  const total = await db.hadith.count();
  console.log(`Inserted ${inserted} Bihar hadith records (DB total: ${total})`);
}

main()
  .catch((e) => { console.error("\nBihar import error:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
