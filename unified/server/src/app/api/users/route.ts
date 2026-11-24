import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/users - List users (filtered by role/branch)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const where: any = { active: true };
    if (role) where.role = role;

    // Role-based filtering
    if (user.role === "BRANCH_MANAGER") {
      where.branchId = user.branchId;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        branchId: true,
        totalPoints: true,
        recognitionsCount: true,
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { totalPoints: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "خطا در دریافت کاربران" }, { status: 500 });
  }
}
