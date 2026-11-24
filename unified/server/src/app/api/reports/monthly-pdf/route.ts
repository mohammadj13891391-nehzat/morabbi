import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { jsPDF } from "jspdf";

// GET /api/reports/monthly-pdf?year=2026&month=10&branchId=xxx or &maktabId=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
    const branchId = searchParams.get("branchId");
    const maktabId = searchParams.get("maktabId");

    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Build filter
    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
    };

    let title = "گزارش ماهانه";
    if (branchId) {
      where.branchId = branchId;
      const branch = await db.branch.findUnique({ where: { id: branchId }, select: { name: true } });
      if (branch) title += ` - ${branch.name}`;
    } else if (maktabId) {
      const maktabBranchIds = await db.branch.findMany({ where: { maktabId }, select: { id: true } });
      where.branchId = { in: maktabBranchIds.map(b => b.id) };
      const maktab = await db.maktab.findUnique({ where: { id: maktabId }, select: { name: true } });
      if (maktab) title += ` - ${maktab.name}`;
    }

    // Get reports
    const reports = await db.dailyReport.findMany({
      where,
      include: {
        instructor: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get evaluations
    const reportIds = reports.map(r => r.id);
    const evaluations = await db.evaluation.findMany({
      where: { targetType: "report", targetId: { in: reportIds } },
      include: { evaluator: { select: { name: true } } },
    });

    // Get recognitions
    const recognitions = await db.recognition.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { user: { select: { name: true } } },
    });

    // Generate PDF
    const pdf = generateMonthlyPDF(title, year, month, reports, evaluations, recognitions);
    const filename = `monthly-${year}-${month}.pdf`;

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Monthly PDF error:", error);
    return NextResponse.json({ error: "خطا در تولید PDF" }, { status: 500 });
  }
}

function generateMonthlyPDF(
  title: string,
  year: number,
  month: number,
  reports: any[],
  evaluations: any[],
  recognitions: any[]
): Buffer {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const persianMonths = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];

  // Header
  doc.setFontSize(16);
  doc.text("نهضت تربیتی حضرت سیدالشهدا (ع)", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text(title, 105, 22, { align: "center" });
  doc.setFontSize(10);
  doc.text(`ماه: ${persianMonths[month - 1] || month} ${year}`, 105, 28, { align: "center" });
  doc.line(20, 32, 190, 32);

  let y = 40;

  // Summary
  doc.setFontSize(12);
  doc.text("خلاصه آماری:", 20, y);
  doc.setFontSize(10);
  doc.text(`تعداد گزارش‌ها: ${reports.length}`, 25, y + 7);
  doc.text(`تعداد ارزیابی‌ها: ${evaluations.length}`, 25, y + 13);
  doc.text(`تعداد تقدیرها: ${recognitions.length}`, 25, y + 19);
  y += 30;

  // Reports list
  doc.setFontSize(12);
  doc.text("فهرست گزارش‌ها:", 20, y);
  y += 7;
  doc.setFontSize(9);

  reports.forEach((r, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const status = r.status === "APPROVED" ? "✓ تأیید" : r.status === "RETURNED" ? "← بازگشت" : r.status === "SUBMITTED" ? "⏳ ارسال" : "✎ پیش‌نویس";
    doc.text(`${i + 1}. ${r.subject}`, 25, y);
    doc.text(`${r.instructor?.name || "—"} | ${r.branch?.name || "—"}`, 80, y);
    doc.text(status, 160, y);
    y += 5;
  });

  // Recognitions
  if (recognitions.length > 0) {
    y += 10;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text("تقدیرها:", 20, y);
    y += 7;
    doc.setFontSize(9);
    recognitions.forEach((r, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${i + 1}. ${r.user?.name} - ${r.title}`, 25, y);
      y += 5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.text(
    `سامانه مربیان نهضت - تولید شده در ${new Date().toLocaleDateString("fa-IR")}`,
    105, 285, { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}
