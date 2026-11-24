import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { jsPDF } from "jspdf";

// GET /api/reports/pdf?id=xxx - Generate PDF for a single report
// GET /api/reports/pdf?branch=xxx&period=yyyy-mm - Generate PDF for branch period
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("id");

    if (reportId) {
      // Single report PDF
      const report = await db.dailyReport.findUnique({
        where: { id: reportId },
        include: {
          instructor: { select: { name: true } },
          branch: { select: { name: true } },
        },
      });

      if (!report) {
        return NextResponse.json({ error: "گزارش یافت نشد" }, { status: 404 });
      }

      // Fetch evaluation separately
      const evaluation = await db.evaluation.findFirst({
        where: { targetType: "report", targetId: reportId },
        include: { evaluator: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });

      const reportWithEval = { ...report, evaluations: evaluation ? [evaluation] : [] };
      const pdf = generateReportPDF(reportWithEval);
      // Use ASCII-only filename to avoid HTTP header encoding issues
      const filename = `report-${report.id.substring(0, 12)}.pdf`;

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "شناسه گزارش الزامی است" }, { status: 400 });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "خطا در تولید PDF" }, { status: 500 });
  }
}

function generateReportPDF(report: any): Buffer {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(16);
  doc.text("نهضت تربیتی حضرت سیدالشهدا (ع)", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text("گزارش روزانه مربی", 105, 22, { align: "center" });
  doc.line(20, 26, 190, 26);

  // Report info
  doc.setFontSize(12);
  doc.text(`عنوان: ${report.subject}`, 20, 35);
  doc.setFontSize(10);
  doc.text(`مربی: ${report.instructor.name}`, 20, 42);
  doc.text(`شعبه: ${report.branch.name}`, 20, 48);
  doc.text(`تاریخ: ${new Date(report.createdAt).toLocaleDateString("fa-IR")}`, 20, 54);
  if (report.audience) {
    doc.text(`گروه مخاطب: ${report.audience}`, 20, 60);
  }
  doc.text(`تعداد حاضران: ${report.attendeesCount}`, 20, 66);

  // Content
  doc.setFontSize(12);
  doc.text("متن گزارش:", 20, 78);
  doc.setFontSize(10);
  const contentLines = doc.splitTextToSize(report.content, 170);
  doc.text(contentLines, 20, 85);

  let y = 85 + contentLines.length * 5 + 5;

  // Challenges
  if (report.challenges) {
    doc.setFontSize(12);
    doc.text("چالش‌ها:", 20, y);
    doc.setFontSize(10);
    const challengeLines = doc.splitTextToSize(report.challenges, 170);
    doc.text(challengeLines, 20, y + 7);
    y += 7 + challengeLines.length * 5 + 5;
  }

  // Solutions
  if (report.solutions) {
    doc.setFontSize(12);
    doc.text("راهکارها:", 20, y);
    doc.setFontSize(10);
    const solutionLines = doc.splitTextToSize(report.solutions, 170);
    doc.text(solutionLines, 20, y + 7);
    y += 7 + solutionLines.length * 5 + 5;
  }

  // Pedagogical Notes
  if (report.pedagogicalNotes) {
    doc.setFontSize(12);
    doc.text("ملاحظات تربیتی:", 20, y);
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(report.pedagogicalNotes, 170);
    doc.text(noteLines, 20, y + 7);
    y += 7 + noteLines.length * 5 + 5;
  }

  // Quran References
  const quranRefs = JSON.parse(report.quranRefs || "[]");
  if (quranRefs.length > 0) {
    doc.setFontSize(12);
    doc.text("آیات مرتبط:", 20, y);
    doc.setFontSize(10);
    quranRefs.forEach((ref: any, i: number) => {
      doc.text(`${ref.surahName || ref.surah}:${ref.ayah} - ${ref.text?.substring(0, 60) || ""}`, 20, y + 7 + i * 5);
    });
    y += 7 + quranRefs.length * 5 + 5;
  }

  // Hadith References
  const hadithRefs = JSON.parse(report.hadithRefs || "[]");
  if (hadithRefs.length > 0) {
    doc.setFontSize(12);
    doc.text("روایات مرتبط:", 20, y);
    doc.setFontSize(10);
    hadithRefs.forEach((ref: any, i: number) => {
      const refText = `${ref.source || ""} ${ref.reference || ""} - ${ref.text?.substring(0, 60) || ""}`;
      doc.text(refText, 20, y + 7 + i * 5);
    });
    y += 7 + hadithRefs.length * 5 + 5;
  }

  // Evaluation
  if (report.evaluations && report.evaluations.length > 0) {
    const eval0 = report.evaluations[0];
    doc.setFontSize(12);
    doc.text("ارزیابی:", 20, y);
    doc.setFontSize(10);
    doc.text(`ارزیاب: ${eval0.evaluator.name}`, 20, y + 7);
    if (eval0.overallComment) {
      const evalLines = doc.splitTextToSize(`توضیح: ${eval0.overallComment}`, 170);
      doc.text(evalLines, 20, y + 13);
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.text(
    `سامانه مربیان نهضت - تولید شده در ${new Date().toLocaleDateString("fa-IR")}`,
    105, 285, { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}
