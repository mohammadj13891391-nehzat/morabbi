import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/profile - Get current user's full profile
// GET /api/profile?userId=xxx - Get another user's profile
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req as unknown as Request);
    if (!currentUser) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || currentUser.id;

    const profile = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, phone: true, role: true, nationalId: true,
        branchId: true, maktabId: true, totalPoints: true, recognitionsCount: true,
        approvalStatus: true, createdAt: true,
        branch: { select: { id: true, name: true } },
        maktab: { select: { id: true, name: true } },
        _count: {
          select: {
            reportsAuthored: true,
            lessonPlansAuthored: true,
            evaluationsGiven: true,
            recognitions: true,
            comments: true,
          },
        },
      },
    });

    if (!profile) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });

    // Recent activity
    const recentReports = await db.dailyReport.findMany({
      where: { instructorId: userId },
      select: { id: true, subject: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentRecognitions = await db.recognition.findMany({
      where: { userId },
      select: { id: true, title: true, level: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ profile, recentReports, recentRecognitions });
  } catch (error) {
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}
