// Restore prisma/dev.db from the committed prisma/dev.db.zip (run after clone).
// The zip is committed in 5 parts (dev.db.part1..5.zip) via git-lfs.
// This script joins the parts into dev.db.zip (if not already present), then extracts.
// Dependency-free: uses Expand-Archive (Windows) or unzip (mac/linux).
import { execFileSync } from "node:child_process";
import { existsSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const prismaDir = path.resolve("prisma");
const zipPath = path.join(prismaDir, "dev.db.zip");
const dbPath = path.join(prismaDir, "dev.db");
const partCount = 5;

if (!existsSync(zipPath)) {
  const parts = Array.from({ length: partCount }, (_, i) =>
    path.join(prismaDir, `dev.db.part${i + 1}.zip`),
  );
  const missing = parts.filter((p) => !existsSync(p));
  if (missing.length > 0) {
    console.error("prisma/dev.db.zip not found and part files are missing: " + missing.join(", "));
    process.exit(1);
  }
  console.log("Joining " + partCount + " parts into dev.db.zip ...");
  const chunks = parts.map((p) => readFileSync(p));
  writeFileSync(zipPath, Buffer.concat(chunks));
}

if (existsSync(dbPath)) {
  try {
    rmSync(dbPath);
  } catch (e) {
    console.error("Could not remove existing prisma/dev.db (stop the running server first). " + e.message);
    process.exit(1);
  }
}

if (process.platform === "win32") {
  execFileSync("powershell", [
    "-NoProfile",
    "-Command",
    `Expand-Archive -Path "${zipPath}" -DestinationPath "${prismaDir}" -Force`,
  ], { stdio: "inherit" });
} else {
  execFileSync("unzip", ["-o", zipPath, "-d", prismaDir], { stdio: "inherit" });
}

console.log("Restored prisma/dev.db from prisma/dev.db.zip");
