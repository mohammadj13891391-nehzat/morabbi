"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, Check, FileText, ClipboardList } from "lucide-react";
import { REPORT_TEMPLATES, LESSON_PLAN_TEMPLATES, type ReportTemplate, type LessonPlanTemplate } from "@/lib/templates";

interface TemplateSelectorProps {
  type: "report" | "lesson_plan";
  onApply: (data: any) => void;
}

export function TemplateSelector({ type, onApply }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const templates = type === "report" ? REPORT_TEMPLATES : LESSON_PLAN_TEMPLATES;

  const handleApply = (template: ReportTemplate | LessonPlanTemplate) => {
    onApply(template.data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LayoutTemplate className="w-4 h-4 ml-1" />
          الگوهای آماده
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>الگوهای آماده {type === "report" ? "گزارش" : "طرح درس"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="cursor-pointer hover:bg-muted/30" onClick={() => handleApply(tpl)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {tpl.name}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {type === "report" ? (
                        <>
                          {(tpl as ReportTemplate).data.reportPattern && (
                            <Badge variant="outline" className="text-xs">
                              الگو: {patternLabel((tpl as ReportTemplate).data.reportPattern)}
                            </Badge>
                          )}
                          {(tpl as ReportTemplate).data.reportStyle && (
                            <Badge variant="outline" className="text-xs">
                              سبک: {styleLabel((tpl as ReportTemplate).data.reportStyle)}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {(tpl as LessonPlanTemplate).data.objectives.length} هدف
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary">
                    <Check className="w-3 h-3 ml-1" />
                    انتخاب
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function patternLabel(p: string): string {
  const labels: Record<string, string> = {
    CHRONOLOGICAL: "تقدّم زمانی",
    DEDUCTIVE: "قیاسی",
    INDUCTIVE: "استقرایی",
  };
  return labels[p] || p;
}

function styleLabel(s: string): string {
  const labels: Record<string, string> = {
    DESCRIPTIVE: "توصیفی",
    ANALYTICAL: "تحلیلی",
    CRITICAL: "انتقادی",
    PRESCRIPTIVE: "تجویزی",
  };
  return labels[s] || s;
}

// === Self-assessment checklist ===

interface ChecklistItem {
  label: string;
  check: (data: any) => boolean;
  hint: string;
}

export function SelfAssessmentChecklist({
  type,
  data,
  onProceed,
  onCancel,
}: {
  type: "report" | "lesson_plan";
  data: any;
  onProceed: () => void;
  onCancel: () => void;
}) {
  const reportChecklist: ChecklistItem[] = [
    { label: "چکیده گزارش نوشته شده", check: (d) => !!d.summary?.trim(), hint: "چکیده چشمگیرترین بخش کار است" },
    { label: "الگوی گزارش انتخاب شده", check: (d) => !!d.reportPattern, hint: "یکی از تقدّم، قیاسی، استقرایی" },
    { label: "سبک گزارش انتخاب شده", check: (d) => !!d.reportStyle, hint: "توصیفی، تحلیلی، انتقادی، تجویزی" },
    { label: "بدنه گزارش تقسیم‌بندی شده", check: (d) => d.content?.includes("\n") || d.content?.includes("۱") || d.content?.includes("1"), hint: "موضوعات بخش‌بندی شوند" },
    { label: "توصیه‌ها نوشته شده", check: (d) => !!d.recommendations?.trim(), hint: "راهی برای بهبود پروژه" },
    { label: "چالش‌ها ثبت شده", check: (d) => !!d.challenges?.trim(), hint: "ثبت چالش‌های مواجهه" },
    { label: "ملاحظات تربیتی", check: (d) => !!d.pedagogicalNotes?.trim(), hint: "وضعیت یادگیرندگان" },
  ];

  const lessonPlanChecklist: ChecklistItem[] = [
    { label: "هدف کلی نوشته شده", check: (d) => !!d.generalObjective?.trim(), hint: "در یک جمله، قابل اندازه‌گیری" },
    { label: "حداقل یک هدف جزئی", check: (d) => (d.objectives || []).length > 0 && d.objectives[0]?.trim(), hint: "بر اساس عناوین فرعی" },
    { label: "اهداف رفتاری نوشته شده", check: (d) => !!d.behavioralObjectives?.trim(), hint: "با عملکرد، شرایط، معیار" },
    { label: "عناوین فرعی مشخص شده", check: (d) => !!d.subHeadings?.trim(), hint: "با توالی و ترتیب مناسب" },
    { label: "پیش‌نیازها تعیین شده", check: (d) => !!d.prerequisites?.trim(), hint: "رفتار ورودی متربیان" },
    { label: "ارزشیابی تشخیصی طراحی شده", check: (d) => !!d.diagnosticEvaluation?.trim(), hint: "سؤال‌های پیش‌نیاز" },
    { label: "مرحله آمادگی", check: (d) => !!d.preparationPhase?.trim(), hint: "آمادگی مربی و متربی" },
    { label: "مرحله ارائه", check: (d) => !!d.presentationPhase?.trim(), hint: "محتوا، روش، زمان" },
    { label: "روش تدریس مشخص", check: (d) => !!d.teachingMethod?.trim(), hint: "توضیحی، پرسش و پاسخ، ..." },
    { label: "وسایل آموزشی", check: (d) => !!d.teachingAids?.trim(), hint: "وسایل مورد نیاز" },
    { label: "سؤال‌های ارزشیابی", check: (d) => !!d.evaluationQuestions?.trim(), hint: "بر اساس اهداف رفتاری" },
  ];

  const checklist = type === "report" ? reportChecklist : lessonPlanChecklist;
  const passed = checklist.filter((item) => item.check(data)).length;
  const total = checklist.length;
  const percentage = Math.round((passed / total) * 100);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          چک‌لیست خودارزیابی پیش از ارسال
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="text-center p-4 rounded-lg bg-muted/30">
          <div className="text-3xl font-bold text-emerald-600">{percentage}٪</div>
          <div className="text-sm text-muted-foreground mt-1">
            {passed} از {total} مورد تکمیل شده
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentage >= 80 ? "bg-emerald-500" : percentage >= 50 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {checklist.map((item, idx) => {
            const passed = item.check(data);
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2 rounded-lg ${
                  passed ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-orange-50 dark:bg-orange-950/20"
                }`}
              >
                <div className={`mt-0.5 ${passed ? "text-emerald-600" : "text-orange-600"}`}>
                  {passed ? <Check className="w-4 h-4" /> : <span className="text-xs">⚠️</span>}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  {!passed && (
                    <div className="text-xs text-muted-foreground mt-0.5">{item.hint}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {percentage < 80 && (
          <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
            💡 توصیه: قبل از ارسال، موارد ناقص را تکمیل کنید. اما می‌توانید در هر صورت ارسال کنید.
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            بازگشت و تکمیل
          </Button>
          <Button onClick={onProceed}>
            ارسال {type === "report" ? "گزارش" : "طرح درس"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
