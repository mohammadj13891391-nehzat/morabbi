// Sync script for fetching branches and users from central management system
// Usage: bun run scripts/sync-from-central.ts
//
// Environment variables needed:
//   CENTRAL_API_URL - Base URL of central management API
//   CENTRAL_API_TOKEN - Bearer token for authentication
//
// This script is a TEMPLATE - adapt it to match your central system's API.

import { db } from "../src/lib/db";

const CENTRAL_API = process.env.CENTRAL_API_URL || "https://management.yourdomain.ir/api/v1";
const API_TOKEN = process.env.CENTRAL_API_TOKEN;

if (!API_TOKEN) {
  console.warn("⚠️  CENTRAL_API_TOKEN تنظیم نشده. اجرای خشک (dry-run).");
  console.warn("   برای همگام‌سازی واقعی، توکن را در متغیر محیطی تنظیم کنید.");
}

interface CentralBranch {
  id: number | string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  active?: boolean;
  type?: string; // "GIRLS" | "BOYS"
}

interface CentralUser {
  id: string;
  name: string;
  phone: string;
  role: string; // "INSTRUCTOR" | "BRANCH_MANAGER" | ...
  branchId?: number | string;
  active?: boolean;
}

async function fetchFromCentral(path: string): Promise<any> {
  if (!API_TOKEN) {
    console.log(`   [DRY-RUN] GET ${CENTRAL_API}${path}`);
    return null;
  }

  const res = await fetch(`${CENTRAL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

async function syncBranches(): Promise<number> {
  console.log("📍 همگام‌سازی شعب...");
  const data = await fetchFromCentral("/branches");
  if (!data) return 0;

  const branches: CentralBranch[] = data.branches || data;
  let count = 0;

  for (const b of branches) {
    // Find existing by code
    const existing = await db.branch.findUnique({ where: { code: b.code } });

    if (existing) {
      await db.branch.update({
        where: { id: existing.id },
        data: {
          name: b.name,
          address: b.address || null,
          phone: b.phone || null,
        },
      });
      console.log(`  ✓ به‌روزرسانی: ${b.name}`);
    } else {
      await db.branch.create({
        data: {
          name: b.name,
          code: b.code,
          address: b.address || null,
          phone: b.phone || null,
        },
      });
      console.log(`  + ایجاد: ${b.name}`);
    }
    count++;
  }

  return count;
}

async function syncUsers(): Promise<number> {
  console.log("\n👥 همگام‌سازی کاربران...");
  const data = await fetchFromCentral("/users");
  if (!data) return 0;

  const users: CentralUser[] = data.users || data;
  let count = 0;

  for (const u of users) {
    // Find existing by phone
    const existing = await db.user.findUnique({ where: { phone: u.phone } });

    // Map role
    const role = (u.role as any) || "INSTRUCTOR";

    // Find branch by code (assume central system uses branch code)
    let branchId: string | null = null;
    if (u.branchId) {
      const branch = await db.branch.findFirst({
        where: { code: String(u.branchId) },
      });
      if (branch) branchId = branch.id;
    }

    if (existing) {
      // Update existing user (don't change password)
      await db.user.update({
        where: { id: existing.id },
        data: {
          name: u.name,
          role,
          branchId,
          active: u.active ?? true,
        },
      });
      console.log(`  ✓ به‌روزرسانی: ${u.name} (${u.phone})`);
    } else {
      // Create new user with placeholder password
      // The user should reset their password on first login
      await db.user.create({
        data: {
          name: u.name,
          phone: u.phone,
          role,
          branchId,
          active: u.active ?? true,
          // Use a temporary password - user must reset
          passwordHash: "REQUIRES_RESET",
        },
      });
      console.log(`  + ایجاد: ${u.name} (${u.phone}) - نیاز به تنظیم رمز عبور`);
    }
    count++;
  }

  return count;
}

async function main() {
  console.log("🔄 شروع همگام‌سازی با سیستم مدیریت مرکزی...\n");
  console.log(`   آدرس API: ${CENTRAL_API}\n`);

  try {
    const branchCount = await syncBranches();
    const userCount = await syncUsers();

    console.log(`\n✅ همگام‌سازی کامل شد:`);
    console.log(`   • شعب: ${branchCount}`);
    console.log(`   • کاربران: ${userCount}`);

    if (!API_TOKEN) {
      console.log("\n💡 این اجرا در حالت dry-run بود.");
      console.log("   برای همگام‌سازی واقعی، CENTRAL_API_TOKEN را تنظیم کنید.");
    }
  } catch (err: any) {
    console.error(`\n❌ خطا در همگام‌سازی: ${err.message}`);
    process.exit(1);
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
