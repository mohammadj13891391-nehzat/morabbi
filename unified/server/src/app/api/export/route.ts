import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/export?type=reports|evaluations|recognitions&format=csv
// Exports data as CSV (opens in Excel)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "reports";

    let csv = "";
    let filename = "";

    if (type === "reports") {
      const where: any = {};
      if (user.role === "INSTRUCTOR" || user.role === "INSTRUCTOR_ASSISTANT") where.instructorId = user.id;
      else if (user.role === "BRANCH_MANAGER") where.branchId = user.branchId;

      const reports = await db.dailyReport.findMany({
        where,
        include: { instructor: { select: { name: true } }, branch: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      csv = "ردیف,عنوان,مربی,شعبه,تاریخ,وضعیت\n";
      reports.forEach((r, i) => {
        csv += `${i + 1},${escapeCsv(r.subject)},${escapeCsv(r.instructor?.name || "")},${escapeCsv(r.branch?.name || "")},${new Date(r.createdAt).toLocaleDateString("fa-IR")},${r.status}\n`;
      });
      filename = "reports-export.csv";
    } else if (type === "evaluations") {
      const evaluations = await db.evaluation.findMany({
        include: { evaluator: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      csv = "ردیف,نوع,شناسه هدف,ارزیاب,توضیح,تاریخ\n";
      evaluations.forEach((e, i) => {
        csv += `${i + 1},${e.targetType},${e.targetId},${escapeCsv(e.evaluator?.name || "")},${escapeCsv(e.overallComment || "")},${new Date(e.createdAt).toLocaleDateString("fa-IR")}\n`;
      });
      filename = "evaluations-export.csv";
    } else if (type === "recognitions") {
      const recognitions = await db.recognition.findMany({
        include: { user: { select: { name: true } }, branch: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      csv = "ردیف,نام,شعبه,سطح,عنوان,توضیح,دوره,تاریخ\n";
      recognitions.forEach((r, i) => {
        csv += `${i + 1},${escapeCsv(r.user?.name || "")},${escapeCsv(r.branch?.name || "")},${r.level},${escapeCsv(r.title)},${escapeCsv(r.description || "")},${escapeCsv(r.period || "")},${new Date(r.createdAt).toLocaleDateString("fa-IR")}\n`;
      });
      filename = "recognitions-export.csv";
    }

    // Add BOM for Excel UTF-8
    const bom = "\uFEFF";
    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "خطا در خروجی" }, { status: 500 });
  }
}

function escapeCsv(str: string): string {
  if (!str) return "";
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
