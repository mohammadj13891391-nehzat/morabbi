import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";

// GET /api/recognition - List recognitions
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (level) where.level = level;
    if (branchId) where.branchId = branchId;
    else if (user.role === "BRANCH_MANAGER") where.branchId = user.branchId;

    const recognitions = await db.recognition.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, totalPoints: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Also fetch top performers (top by totalPoints)
    const topPerformersWhere: any = { role: "INSTRUCTOR", active: true };
    if (user.role === "BRANCH_MANAGER") {
      topPerformersWhere.branchId = user.branchId;
    }

    const topPerformers = await db.user.findMany({
      where: topPerformersWhere,
      select: {
        id: true,
        name: true,
        totalPoints: true,
        recognitionsCount: true,
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { totalPoints: "desc" },
      take: 10,
    });

    return NextResponse.json({ recognitions, topPerformers });
  } catch (error) {
    console.error("Get recognitions error:", error);
    return NextResponse.json({ error: "خطا در دریافت تقدیرها" }, { status: 500 });
  }
}

// POST /api/recognition - Award recognition (only supervisors)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    if (user.role !== "BRANCH_MANAGER" && user.role !== "CENTRAL_SUPERVISOR" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "فقط مسئولان می‌توانند تقدیر اعطا کنند" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, level, title, description, period, branchId } = body;

    if (!userId || !level || !title) {
      return NextResponse.json(
        { error: "کاربر، سطح و عنوان الزامی است" },
        { status: 400 }
      );
    }

    const recognition = await db.recognition.create({
      data: {
        userId,
        branchId: branchId || user.branchId,
        level,
        title,
        description: description || null,
        period: period || null,
        awardedBy: user.id,
        aiSuggested: false,
      },
    });

    // Update user's recognitions count and add bonus points
    await db.user.update({
      where: { id: userId },
      data: { recognitionsCount: { increment: 1 } },
    });

    // Award bonus points based on level
    const bonusPoints = {
      WEEKLY_BRANCH: 50,
      MONTHLY_BRANCH: 150,
      MONTHLY_CENTRAL: 300,
      SPECIAL: 100,
    } as const;

    await db.pointTransaction.create({
      data: {
        userId,
        branchId: recognition.branchId,
        amount: bonusPoints[level as keyof typeof bonusPoints] || 50,
        reason: "RECOGNITION_BONUS",
        description: `پاداش تقدیر: ${title}`,
        sourceType: "recognition",
        sourceId: recognition.id,
        awardedBy: user.id,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: bonusPoints[level as keyof typeof bonusPoints] || 50 },
      },
    });

    // Notify the recognized instructor
    await notifyUser(
      userId,
      "recognition_awarded",
      `🎉 تقدیر جدید دریافت کردید: ${title}`,
      description || `${user.name} به شما تقدیر اعطا کرد`,
      { recognitionId: recognition.id, level, bonusPoints: bonusPoints[level as keyof typeof bonusPoints] || 50 }
    );

    return NextResponse.json({ recognition });
  } catch (error) {
    console.error("Create recognition error:", error);
    return NextResponse.json({ error: "خطا در اعطای تقدیر" }, { status: 500 });
  }
}
