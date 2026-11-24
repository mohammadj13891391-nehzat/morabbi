import { db } from '../src/lib/db.ts';
import bcrypt from 'bcryptjs';
const u = await db.user.findFirst({ where: { phone: '09120000001' }, select: { phone: true, passwordHash: true, approvalStatus: true, active: true, role: true } });
console.log(JSON.stringify(u));
if (u?.passwordHash) {
  console.log('bcrypt match 567890:', await bcrypt.compare('567890', u.passwordHash));
  console.log('starts $2:', u.passwordHash.startsWith('$2'));
}
await db.$disconnect();
