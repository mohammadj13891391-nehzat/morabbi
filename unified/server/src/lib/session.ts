// Session management - bcrypt + DB-backed sessions
import { db } from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface SessionUser {
  id: string; name: string; phone: string;
  role: string; branchId: string | null; maktabId: string | null;
  totalPoints: number; recognitionsCount: number;
}

export function generateSessionToken(): string { return crypto.randomBytes(32).toString("hex"); }

let lastCleanup = 0;
async function cleanupExpiredSessions() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  try { await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }); } catch {}
}

export async function getCurrentUser(req: Request): Promise<SessionUser | null> {
  try {
    const authHeader = req.headers.get("x-user-id");
    if (!authHeader) return null;
    await cleanupExpiredSessions();
    let userId: string | null = null;
    if (authHeader.length === 64 && /^[a-f0-9]+$/.test(authHeader)) {
      const session = await db.session.findUnique({ where: { token: authHeader }, select: { userId: true, expiresAt: true } });
      if (!session) return null;
      if (session.expiresAt < new Date()) { await db.session.delete({ where: { token: authHeader } }).catch(() => {}); return null; }
      userId = session.userId;
    } else { userId = authHeader; }
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, phone: true, role: true, branchId: true, maktabId: true, totalPoints: true, recognitionsCount: true, active: true } });
    if (!user || !user.active) return null;
    const { active, ...sessionUser } = user as any;
    return sessionUser;
  } catch { return null; }
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  await db.session.create({ data: { token, userId, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  return token;
}
export async function destroySession(token: string): Promise<void> { try { await db.session.delete({ where: { token } }); } catch {} }

export async function loginByPhone(phone: string, password: string): Promise<{ user: SessionUser; token: string } | { error: string } | null> {
  const user = await db.user.findUnique({ where: { phone }, select: { id: true, name: true, phone: true, role: true, branchId: true, maktabId: true, totalPoints: true, recognitionsCount: true, active: true, passwordHash: true, approvalStatus: true } });
  if (!user) return null;
  if ((user as any).approvalStatus === "PENDING") return { error: "حساب شما در انتظار تأیید مسئول است" };
  if ((user as any).approvalStatus === "REJECTED") return { error: "ثبت‌نام شما رد شده است" };
  if (!user.active) return null;
  if (!user.passwordHash) return null;
  let valid = user.passwordHash.startsWith("$2") ? await bcrypt.compare(password, user.passwordHash) : user.passwordHash === password;
  if (!valid) return null;
  const { active, passwordHash, approvalStatus, ...sessionUser } = user as any;
  const token = await createSession(user.id);
  return { user: sessionUser as SessionUser, token };
}

export function toPersianDate(date: Date): string { try { return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(date); } catch { return date.toISOString().split("T")[0]; } }
export function toPersianDateTime(date: Date): string { try { return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date); } catch { return date.toISOString(); } }
