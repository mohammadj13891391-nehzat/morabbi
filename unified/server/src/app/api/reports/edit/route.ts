import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// PATCH /api/reports/edit - Edit a report (only if DRAFT or RETURNED)
// Body: { reportId, ...fields }
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const body = await req.json();
    const { reportId, ...updates } = body;

    if (!reportId) {
      return NextResponse.json({ error: "شناسه گزارش الزامی است" }, { status: 400 });
    }

    const report = await db.dailyReport.findUnique({
      where: { id: reportId },
      select: { id: true, instructorId: true, status: true },
    });

    if (!report) {
      return NextResponse.json({ error: "گزارش یافت نشد" }, { status: 404 });
    }

    // Only the instructor can edit their own report
    if (report.instructorId !== user.id) {
      return NextResponse.json({ error: "فقط نویسنده گزارش می‌تواند ویرایش کند" }, { status: 403 });
    }

    // Only allow editing if DRAFT or RETURNED
    if (report.status !== "DRAFT" && report.status !== "RETURNED") {
      return NextResponse.json({ error: "در وضعیت فعلی، ویرایش مجاز نیست" }, { status: 400 });
    }

    // Build update data (only allow specific fields)
    const allowedFields = [
      "subject", "summary", "content", "reportPattern", "reportStyle",
      "audience", "attendeesCount", "challenges", "solutions",
      "pedagogicalNotes", "recommendations", "quranRefs", "hadithRefs",
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === "quranRefs" || field === "hadithRefs") {
          updateData[field] = JSON.stringify(updates[field]);
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    // If status is RETURNED, change to SUBMITTED after edit (re-submit)
    if (report.status === "RETURNED" && updates.resubmit) {
      updateData.status = "SUBMITTED";
    }

    const updated = await db.dailyReport.update({
      where: { id: reportId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      report: updated,
      message: updates.resubmit ? "گزارش ویرایش و دوباره ارسال شد" : "گزارش ویرایش شد",
    });
  } catch (error) {
    console.error("Edit report error:", error);
    return NextResponse.json({ error: "خطا در ویرایش" }, { status: 500 });
  }
}
