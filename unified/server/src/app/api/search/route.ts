import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/search?q=keyword&type=all|reports|lesson_plans
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";

    if (!q.trim()) return NextResponse.json({ results: [] });

    const results: any[] = [];

    // Role-based filter
    const reportWhere: any = { OR: [{ subject: { contains: q } }, { content: { contains: q } }, { summary: { contains: q } }] };
    if (user.role === "INSTRUCTOR" || user.role === "INSTRUCTOR_ASSISTANT") reportWhere.instructorId = user.id;
    else if (user.role === "BRANCH_MANAGER") reportWhere.branchId = user.branchId;

    if (type === "all" || type === "reports") {
      const reports = await db.dailyReport.findMany({
        where: reportWhere,
        include: { instructor: { select: { name: true } }, branch: { select: { name: true } } },
        take: 20,
        orderBy: { createdAt: "desc" },
      });
      reports.forEach(r => results.push({
        type: "report", id: r.id, title: r.subject, subtitle: `${r.instructor?.name} • ${r.branch?.name}`, date: r.createdAt, status: r.status,
      }));
    }

    if (type === "all" || type === "lesson_plans") {
      const planWhere: any = { OR: [{ title: { contains: q } }, { subject: { contains: q } }, { generalObjective: { contains: q } }] };
      if (user.role === "INSTRUCTOR" || user.role === "INSTRUCTOR_ASSISTANT") planWhere.instructorId = user.id;
      else if (user.role === "BRANCH_MANAGER") planWhere.branchId = user.branchId;

      const plans = await db.lessonPlan.findMany({
        where: planWhere,
        include: { instructor: { select: { name: true } }, branch: { select: { name: true } } },
        take: 20,
        orderBy: { createdAt: "desc" },
      });
      plans.forEach(p => results.push({
        type: "lesson_plan", id: p.id, title: p.title, subtitle: `${p.instructor?.name} • ${p.branch?.name}`, date: p.createdAt, status: p.status,
      }));
    }

    if (type === "all" || type === "people") {
      const people = await db.person.findMany({
        where: { OR: [{ name: { contains: q } }, { note: { contains: q } }, { grade: { contains: q } }] },
        take: 20, orderBy: { createdAt: "desc" },
      });
      people.forEach(p => results.push({
        type: "person", id: p.id, title: p.name, subtitle: [p.grade, p.group].filter(Boolean).join(" • ") || "فرد", date: p.createdAt,
      }));
    }

    if (type === "all" || type === "quran") {
      const verses = await db.quranVerse.findMany({
        where: { OR: [{ textSimple: { contains: q } }, { surahNameFa: { contains: q } }] },
        take: 20,
      });
      verses.forEach(v => results.push({
        type: "quran", id: v.id, title: `${v.surahNameFa} ${v.ayah}`, subtitle: v.textSimple.slice(0, 60), date: null,
      }));
    }

    if (type === "all" || type === "hadith") {
      const hadiths = await db.hadith.findMany({
        where: { OR: [{ textAr: { contains: q } }, { textFa: { contains: q } }, { source: { contains: q } }] },
        take: 20, orderBy: { createdAt: "desc" },
      });
      hadiths.forEach(h => results.push({
        type: "hadith", id: h.id, title: h.source, subtitle: (h.textAr || "").slice(0, 60), date: h.createdAt,
      }));
    }

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    return NextResponse.json({ error: "خطا در جستجو" }, { status: 500 });
  }
}
