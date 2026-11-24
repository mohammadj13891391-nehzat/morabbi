import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { notifyUser } from "@/lib/notifications";

// GET /api/comments?targetType=report&targetId=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    if (!targetType || !targetId) {
      return NextResponse.json({ comments: [] });
    }

    const comments = await db.comment.findMany({
      where: { targetType, targetId },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "خطا در دریافت کامنت‌ها" }, { status: 500 });
  }
}

// POST /api/comments - Add comment
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const body = await req.json();
    const { targetType, targetId, body: commentBody, anchor, parentId } = body;

    if (!targetType || !targetId || !commentBody) {
      return NextResponse.json(
        { error: "نوع، شناسه و متن کامنت الزامی است" },
        { status: 400 }
      );
    }

    const comment = await db.comment.create({
      data: {
        targetType,
        targetId,
        authorId: user.id,
        body: commentBody,
        anchor: anchor || null,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    // Notify the author of the target (instructor who wrote the report/lesson plan)
    // but only if the commenter is NOT the original author
    const target =
      targetType === "report"
        ? await db.dailyReport.findUnique({
            where: { id: targetId },
            select: { instructorId: true, subject: true },
          })
        : await db.lessonPlan.findUnique({
            where: { id: targetId },
            select: { instructorId: true, title: true },
          });

    if (target && target.instructorId !== user.id) {
      const itemTitle = targetType === "report"
        ? (target as any).subject
        : (target as any).title;
      await notifyUser(
        target.instructorId,
        "comment_added",
        `پیام جدید روی ${targetType === "report" ? "گزارش" : "طرح درس"} شما`,
        `${user.name}: ${commentBody.substring(0, 100)}${commentBody.length > 100 ? "..." : ""}`,
        { targetType, targetId, commentId: comment.id, itemTitle }
      );
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "خطا در ثبت کامنت" }, { status: 500 });
  }
}
