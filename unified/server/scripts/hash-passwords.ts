// Update all existing user passwords to use bcrypt hashing
// Run with: bun run scripts/hash-passwords.ts

import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🔐 هش کردن رمزهای عبور کاربران...\n");

  const users = await db.user.findMany({
    select: { id: true, name: true, phone: true, passwordHash: true },
  });

  console.log(`📊 کاربران یافت‌شده: ${users.length}\n`);

  let updated = 0;
  for (const user of users) {
    // Check if already hashed (bcrypt hashes start with $2)
    if (user.passwordHash.startsWith("$2")) {
      console.log(`  ⏭️ ${user.name} (${user.phone}) - از قبل هش شده`);
      continue;
    }

    // Hash the password (default password is "demo")
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("demo", salt);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    console.log(`  ✓ ${user.name} (${user.phone})`);
    updated++;
  }

  console.log(`\n✅ ${updated} کاربر به‌روزرسانی شد`);
  console.log(`\n💡 رمز عبور همه کاربران: demo (با هش bcrypt)`);
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
