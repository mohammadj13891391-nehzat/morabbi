// Restore prisma/dev.db from the committed prisma/dev.db.zip (run after clone).
// Dependency-free: uses Expand-Archive (Windows) or unzip (mac/linux).
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const prismaDir = path.resolve("prisma");
const zipPath = path.join(prismaDir, "dev.db.zip");
const dbPath = path.join(prismaDir, "dev.db");

if (!existsSync(zipPath)) {
  console.error("prisma/dev.db.zip not found. Run this from unified/server.");
  process.exit(1);
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
