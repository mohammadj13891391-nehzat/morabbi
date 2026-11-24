import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// PATCH /api/lesson-plans/edit - Edit a lesson plan (only DRAFT or RETURNED)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });

    const { planId, ...updates } = await req.json();
    if (!planId) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

    const plan = await db.lessonPlan.findUnique({ where: { id: planId }, select: { id: true, instructorId: true, status: true } });
    if (!plan) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    if (plan.instructorId !== user.id) return NextResponse.json({ error: "فقط نویسنده" }, { status: 403 });
    if (plan.status !== "DRAFT" && plan.status !== "RETURNED") return NextResponse.json({ error: "در وضعیت فعلی مجاز نیست" }, { status: 400 });

    const allowed = ["title","subject","grade","generalObjective","objectives","behavioralObjectives","subHeadings","prerequisites","diagnosticEvaluation","preparationPhase","introductionPhase","presentationPhase","summaryPhase","evaluationPhase","supplementaryActivities","teachingMethod","teachingAids","evaluationQuestions","quranRefs","hadithRefs","sources"];
    const data: any = {};
    for (const f of allowed) {
      if (updates[f] !== undefined) {
        if (["objectives","quranRefs","hadithRefs","sources"].includes(f)) data[f] = JSON.stringify(updates[f]);
        else data[f] = updates[f];
      }
    }
    if (plan.status === "RETURNED" && updates.resubmit) data.status = "SUBMITTED";

    const updated = await db.lessonPlan.update({ where: { id: planId }, data });
    return NextResponse.json({ success: true, plan: updated, message: updates.resubmit ? "ویرایش و ارسال شد" : "ویرایش شد" });
  } catch (error) {
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}
