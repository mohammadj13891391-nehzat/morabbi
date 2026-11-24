import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { jsPDF } from "jspdf";

// GET /api/lesson-plans/pdf?id=xxx
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("id");

    if (!planId) {
      return NextResponse.json({ error: "شناسه طرح درس الزامی است" }, { status: 400 });
    }

    const plan = await db.lessonPlan.findUnique({
      where: { id: planId },
      include: {
        instructor: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "طرح درس یافت نشد" }, { status: 404 });
    }

    const pdf = generateLessonPlanPDF(plan);
    // Use ASCII-only filename to avoid HTTP header encoding issues
    const filename = `lesson-plan-${plan.id.substring(0, 12)}.pdf`;

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "خطا در تولید PDF" }, { status: 500 });
  }
}

function generateLessonPlanPDF(plan: any): Buffer {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(16);
  doc.text("نهضت تربیتی حضرت سیدالشهدا (ع)", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text("طرح درس", 105, 22, { align: "center" });
  doc.line(20, 26, 190, 26);

  // Basic info
  doc.setFontSize(12);
  doc.text(`عنوان: ${plan.title}`, 20, 35);
  doc.setFontSize(10);
  doc.text(`موضوع: ${plan.subject}`, 20, 42);
  doc.text(`مربی: ${plan.instructor.name}`, 20, 48);
  doc.text(`شعبه: ${plan.branch.name}`, 20, 54);
  if (plan.grade) doc.text(`پایه: ${plan.grade}`, 20, 60);
  doc.text(`تعداد جلسات: ${plan.sessionCount}`, 20, 66);

  let y = 75;

  // General Objective
  if ((plan as any).generalObjective) {
    doc.setFontSize(12);
    doc.text("هدف کلی:", 20, y);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize((plan as any).generalObjective, 170);
    doc.text(lines, 20, y + 7);
    y += 7 + lines.length * 5 + 5;
  }

  // Objectives
  const objectives = JSON.parse(plan.objectives || "[]");
  if (objectives.length > 0) {
    doc.setFontSize(12);
    doc.text("اهداف جزئی:", 20, y);
    doc.setFontSize(10);
    objectives.forEach((obj: string, i: number) => {
      doc.text(`• ${obj}`, 25, y + 7 + i * 5);
    });
    y += 7 + objectives.length * 5 + 5;
  }

  // Behavioral Objectives
  if ((plan as any).behavioralObjectives) {
    doc.setFontSize(12);
    doc.text("اهداف رفتاری:", 20, y);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize((plan as any).behavioralObjectives, 170);
    doc.text(lines, 20, y + 7);
    y += 7 + lines.length * 5 + 5;
  }

  // Sub-headings
  if ((plan as any).subHeadings) {
    doc.setFontSize(12);
    doc.text("عناوین فرعی:", 20, y);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize((plan as any).subHeadings, 170);
    doc.text(lines, 20, y + 7);
    y += 7 + lines.length * 5 + 5;
  }

  // Prerequisites
  if (plan.prerequisites) {
    doc.setFontSize(12);
    doc.text("پیش‌نیازها:", 20, y);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(plan.prerequisites, 170);
    doc.text(lines, 20, y + 7);
    y += 7 + lines.length * 5 + 5;
  }

  // Diagnostic Evaluation
  if ((plan as any).diagnosticEvaluation) {
    doc.setFontSize(12);
    doc.text("ارزشیابی تشخیصی:", 20, y);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize((plan as any).diagnosticEvaluation, 170);
    doc.text(lines, 20, y + 7);
    y += 7 + lines.length * 5 + 5;
  }

  // Teaching phases
  const phases = [
    { label: "مرحله آمادگی", field: "preparationPhase" },
    { label: "مرحله معرفی", field: "introductionPhase" },
    { label: "مرحله ارائه", field: "presentationPhase" },
    { label: "مرحله خلاصه", field: "summaryPhase" },
    { label: "مرحله ارزشیابی", field: "evaluationPhase" },
    { label: "فعالیت‌های تکمیلی", field: "supplementaryActivities" },
  ];
  for (const phase of phases) {
    if ((plan as any)[phase.field]) {
      doc.setFontSize(12);
      doc.text(`${phase.label}:`, 20, y);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize((plan as any)[phase.field], 170);
      doc.text(lines, 20, y + 7);
      y += 7 + lines.length * 5 + 5;
    }
  }

  // Teaching aids
  if ((plan as any).teachingAids) {
    doc.setFontSize(12);
    doc.text("وسایل آموزشی:", 20, y);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize((plan as any).teachingAids, 170);
    doc.text(lines, 20, y + 7);
    y += 7 + lines.length * 5 + 5;
  }

  // Evaluation questions
  if ((plan as any).evaluationQuestions) {
    doc.setFontSize(12);
    doc.text("سؤال‌های ارزشیابی:", 20, y);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize((plan as any).evaluationQuestions, 170);
    doc.text(lines, 20, y + 7);
    y += 7 + lines.length * 5 + 5;
  }

  // Quran refs
  const quranRefs = JSON.parse(plan.quranRefs || "[]");
  if (quranRefs.length > 0) {
    doc.setFontSize(12);
    doc.text("آیات مرتبط:", 20, y);
    doc.setFontSize(10);
    quranRefs.forEach((ref: any, i: number) => {
      doc.text(`${ref.surahName || ref.surah}:${ref.ayah}`, 25, y + 7 + i * 5);
    });
    y += 7 + quranRefs.length * 5 + 5;
  }

  // Sources
  const sources = JSON.parse(plan.sources || "[]");
  if (sources.length > 0) {
    doc.setFontSize(12);
    doc.text("منابع:", 20, y);
    doc.setFontSize(10);
    doc.text(sources.join("، "), 20, y + 7);
  }

  // Footer
  doc.setFontSize(8);
  doc.text(
    `سامانه مربیان نهضت - تولید شده در ${new Date().toLocaleDateString("fa-IR")}`,
    105, 285, { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}
