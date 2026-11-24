import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/ai/evaluate - Generate AI evaluation suggestion
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as unknown as Request);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    if (user.role !== "BRANCH_MANAGER" && user.role !== "CENTRAL_SUPERVISOR" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "فقط مسئولان می‌توانند ارزیابی هوشمند درخواست کنند" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "نوع و شناسه هدف الزامی است" },
        { status: 400 }
      );
    }

    const target =
      targetType === "report"
        ? await db.dailyReport.findUnique({
            where: { id: targetId },
            include: {
              instructor: { select: { name: true } },
              branch: { select: { name: true } },
            },
          })
        : await db.lessonPlan.findUnique({
            where: { id: targetId },
            include: {
              instructor: { select: { name: true } },
              branch: { select: { name: true } },
            },
          });

    if (!target) {
      return NextResponse.json({ error: "هدف یافت نشد" }, { status: 404 });
    }

    const criteriaType = targetType === "report" ? "REPORT" : "LESSON_PLAN";
    const criteria = await db.evaluationCriteria.findMany({
      where: { type: criteriaType, active: true },
    });

    const reportData = {
      type: targetType === "report" ? "گزارش روزانه" : "طرح درس",
      instructor: target.instructor.name,
      branch: target.branch.name,
      subject: target.subject,
      content: target.content,
      // فیلدهای جدید گزارش (طبق سند نهضت)
      summary: (target as any).summary,
      reportPattern: (target as any).reportPattern,
      reportStyle: (target as any).reportStyle,
      recommendations: (target as any).recommendations,
      // فیلدهای موجود
      quranRefs: JSON.parse(target.quranRefs || "[]"),
      hadithRefs: JSON.parse(target.hadithRefs || "[]"),
      challenges: target.challenges,
      solutions: target.solutions,
      pedagogicalNotes: (target as any).pedagogicalNotes,
      // فیلدهای طرح درس (طبق سند نهضت)
      generalObjective: (target as any).generalObjective,
      objectives: (target as any).objectives ? JSON.parse((target as any).objectives) : undefined,
      behavioralObjectives: (target as any).behavioralObjectives,
      subHeadings: (target as any).subHeadings,
      prerequisites: (target as any).prerequisites,
      diagnosticEvaluation: (target as any).diagnosticEvaluation,
      preparationPhase: (target as any).preparationPhase,
      introductionPhase: (target as any).introductionPhase,
      presentationPhase: (target as any).presentationPhase,
      summaryPhase: (target as any).summaryPhase,
      evaluationPhase: (target as any).evaluationPhase,
      supplementaryActivities: (target as any).supplementaryActivities,
      teachingMethod: (target as any).teachingMethod,
      teachingAids: (target as any).teachingAids,
      evaluationQuestions: (target as any).evaluationQuestions,
    };

    const criteriaList = criteria.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      weight: c.weight,
    }));

    const prompt = `شما یک دستیار هوشمند برای ارزیابی ${targetType === "report" ? "گزارش‌های روزانه" : "طرح‌درس‌ها"} آموزشی در نهضت تربیتی حضرت سیدالشهدا علیه‌السلام (مجموعه مذهبی شیعی) هستید.

${targetType === "report" ? 
`# ساختار مورد انتظار گزارش (طبق سند «اصول و روش گزارش‌نویسی نهضت»):
- **عنوان**: شامل موضوع، تاریخ، نویسنده، جایگاه
- **چکیده**: نکات مهم، توصیه‌ها، نتیجه‌گیری‌ها (کوتاه و شفاف)
- **بدنه**: تقسیم‌بندی موضوعات با توضیحات کامل
- **توصیه‌ها**: پیشنهادات کاربردی برای ادامه کار
- **الگو**: یکی از تقدّم زمانی، قیاسی، یا استقرایی
- **سبک**: یکی از توصیفی، تحلیلی، انتقادی، یا تجویزی
- **اصول**: دقت محتوایی، ظاهر حرفه‌ای، بهره‌وری، ثبات ساختار، کاربردی بودن` :
`# ساختار مورد انتظار طرح درس (طبق سند «اصول و روش طرح‌درس‌نویسی»):
- **عنوان و عناوین فرعی**: دقیق و با ترتیب مناسب
- **هدف کلی**: در یک جمله، قابل اندازه‌گیری
- **اهداف جزئی**: بر اساس عناوین فرعی
- **اهداف رفتاری**: با عملکرد، شرایط، معیار
- **رفتار ورودی**: پیش‌نیازهای درس
- **ارزشیابی تشخیصی**: سؤال‌های پیش‌نیاز
- **مراحل تدریس**: آمادگی، معرفی، ارائه، خلاصه، ارزشیابی، تکمیلی
- **روش تدریس**: مشخص (توضیحی، پرسش و پاسخ، ...)
- **وسایل آموزشی**: مشخص
- **ارزشیابی پایانی**: بر اساس اهداف رفتاری`}

لطفاً ${targetType === "report" ? "گزارش" : "طرح درس"} زیر را بر اساس معیارهای مشخص‌شده ارزیابی کنید و خروجی را به‌صورت JSON معتبر بازگردانید.

# ${targetType === "report" ? "گزارش" : "طرح درس"} برای ارزیابی:
${JSON.stringify(reportData, null, 2)}

# معیارهای ارزیابی:
${JSON.stringify(criteriaList, null, 2)}

# دستورالعمل:
۱. برای هر معیار، امتیاز ۰ تا ۱۰ بدهید (با ذکر دلیل کوتاه).
۲. ارزیابی را بر اساس ساختار مورد انتظار سند نهضت انجام دهید.
۳. نقاط قوت و نقاط ضعف را فهرست کنید.
۴. پیشنهادهای بهبود ارائه دهید.
۵. اگر در ${targetType === "report" ? "گزارش" : "طرح درس"} به آیات قرآن یا روایات ارجاع داده شده، انطباق آن‌ها را بررسی کنید.
۶. این یک پیشنهاد هوشمند است و تصمیم نهایی با مسئول ارزیابی است.

# خروجی (فقط JSON، بدون توضیح اضافه):
{
  "scores": { "criterionId": { "score": number, "reasoning": string } },
  "overallScore": number,
  "strengths": [string],
  "weaknesses": [string],
  "improvementSuggestions": [string],
  "sourceWarnings": [{ "type": "quran" | "hadith", "issue": string, "severity": "low" | "medium" | "high" }]
}`;

    let aiOutput: any;
    let modelVersion = "unknown";
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "شما یک متخصص ارزیابی آموزشی در حوزه آموزش‌های دینی شیعی هستید. همیشه خروجی JSON معتبر ارائه می‌دهید.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      });
      const responseText = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      aiOutput = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawResponse: responseText };
      modelVersion = "glm-v2";
    } catch (aiError) {
      console.error("AI error:", aiError);
      aiOutput = generateFallbackEvaluation(reportData, criteriaList);
      modelVersion = "fallback-heuristic";
    }

    const aiSuggestion = await db.aISuggestion.create({
      data: {
        targetType,
        targetId,
        inputSnapshot: JSON.stringify({ reportData, criteriaList }),
        outputJson: JSON.stringify(aiOutput),
        modelVersion,
      },
    });

    return NextResponse.json({
      suggestion: aiSuggestion,
      output: aiOutput,
      modelVersion,
    });
  } catch (error) {
    console.error("AI evaluate error:", error);
    return NextResponse.json({ error: "خطا در ارزیابی هوشمند" }, { status: 500 });
  }
}

function generateFallbackEvaluation(reportData: any, criteria: any[]) {
  const scores: any = {};
  let totalScore = 0;
  let totalWeight = 0;

  for (const c of criteria) {
    let score = 6;
    if (reportData.content && reportData.content.length > 200) score += 1;
    if (reportData.quranRefs && reportData.quranRefs.length > 0) score += 1;
    if (reportData.hadithRefs && reportData.hadithRefs.length > 0) score += 1;
    if (reportData.challenges) score += 0.5;
    if (reportData.pedagogicalNotes) score += 0.5;
    score = Math.min(score, 10);

    scores[c.id] = {
      score,
      reasoning: `ارزیابی خودکار: ${score.toFixed(1)}/۱۰ — این ارزیابی جایگزین است هنگام در دسترس نبودن سرویس AI.`,
    };
    totalScore += score * c.weight;
    totalWeight += c.weight;
  }

  const overallScore = totalWeight ? totalScore / totalWeight : 0;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (reportData.quranRefs?.length) strengths.push("ارجاع به آیات قرآن");
  if (reportData.hadithRefs?.length) strengths.push("ارجاع به روایات");
  if (reportData.content?.length > 200) strengths.push("متن گزارش جامع");
  if (!reportData.challenges) weaknesses.push("ثبت نشدن چالش‌ها");
  if (!reportData.pedagogicalNotes) weaknesses.push("عدم ثبت ملاحظات تربیتی");

  return {
    scores,
    overallScore,
    strengths,
    weaknesses,
    improvementSuggestions: [
      "ثبت چالش‌های جلسه و راهکارهای اتخاذشده",
      "افزودن ملاحظات تربیتی",
      "اشاره به روش تدریس استفاده‌شده",
    ],
    sourceWarnings: [],
    _fallback: true,
  };
}
