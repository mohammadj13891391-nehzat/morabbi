"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/app-constants";
import { savePendingLessonPlan } from "@/lib/offline-db";
import { syncNow } from "@/lib/sync";
import { Plus, X, BookOpen, Save, Send, FileText } from "lucide-react";
import { toast } from "sonner";

interface LessonPlanFormProps {
  user: any;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function LessonPlanForm({ user, onSubmitted, onCancel }: LessonPlanFormProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [sessionCount, setSessionCount] = useState("1");

  // === اهداف (طبق سند: کلی، جزئی، رفتاری) ===
  const [generalObjective, setGeneralObjective] = useState("");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [behavioralObjectives, setBehavioralObjectives] = useState("");

  // === عناوین فرعی و پیش‌نیازها ===
  const [subHeadings, setSubHeadings] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [diagnosticEvaluation, setDiagnosticEvaluation] = useState("");

  // === مراحل اجرای تدریس (طبق سند) ===
  const [preparationPhase, setPreparationPhase] = useState("");
  const [introductionPhase, setIntroductionPhase] = useState("");
  const [presentationPhase, setPresentationPhase] = useState("");
  const [summaryPhase, setSummaryPhase] = useState("");
  const [evaluationPhase, setEvaluationPhase] = useState("");
  const [supplementaryActivities, setSupplementaryActivities] = useState("");

  // === روش و ابزار ===
  const [teachingMethod, setTeachingMethod] = useState("");
  const [teachingAids, setTeachingAids] = useState("");
  const [evaluationQuestions, setEvaluationQuestions] = useState("");
  const [evaluationMethod, setEvaluationMethod] = useState(""); // legacy

  // === legacy ===
  const [contentOutline, setContentOutline] = useState(""); // legacy

  const [sources, setSources] = useState<string[]>([""]);
  const [quranRefs, setQuranRefs] = useState<any[]>([]);
  const [hadithRefs, setHadithRefs] = useState<any[]>([{ source: "", reference: "", text: "" }]);

  // Quran search state
  const [showQuranSearch, setShowQuranSearch] = useState(false);
  const [quranQuery, setQuranQuery] = useState("");
  const [quranResults, setQuranResults] = useState<any[]>([]);
  const [searchingQuran, setSearchingQuran] = useState(false);

  const searchQuran = async () => {
    if (!quranQuery.trim()) return;
    setSearchingQuran(true);
    try {
      const result = await apiFetch(`/api/quran/search?q=${encodeURIComponent(quranQuery)}`);
      setQuranResults(result.verses);
    } catch (err: any) {
      toast.error("خطا در جستجوی قرآن: " + err.message);
    } finally {
      setSearchingQuran(false);
    }
  };

  const addQuranRef = (verse: any) => {
    if (quranRefs.some(r => r.surah === verse.surah && r.ayah === verse.ayah)) {
      toast.info("این آیه قبلاً اضافه شده است");
      return;
    }
    setQuranRefs([...quranRefs, {
      surah: verse.surah,
      ayah: verse.ayah,
      surahName: verse.surahNameFa,
      text: verse.textUthmani,
    }]);
    toast.success(`آیه ${verse.surahNameFa} ${verse.ayah} اضافه شد`);
  };

  const removeQuranRef = (idx: number) => {
    setQuranRefs(quranRefs.filter((_, i) => i !== idx));
  };

  const updateObjective = (idx: number, value: string) => {
    const updated = [...objectives];
    updated[idx] = value;
    setObjectives(updated);
  };

  const addObjective = () => {
    setObjectives([...objectives, ""]);
  };

  const removeObjective = (idx: number) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
  };

  const updateSource = (idx: number, value: string) => {
    const updated = [...sources];
    updated[idx] = value;
    setSources(updated);
  };

  const addSource = () => {
    setSources([...sources, ""]);
  };

  const removeSource = (idx: number) => {
    setSources(sources.filter((_, i) => i !== idx));
  };

  const updateHadithRef = (idx: number, field: string, value: string) => {
    const updated = [...hadithRefs];
    updated[idx] = { ...updated[idx], [field]: value };
    setHadithRefs(updated);
  };

  const addHadithRef = () => {
    setHadithRefs([...hadithRefs, { source: "", reference: "", text: "" }]);
  };

  const removeHadithRef = (idx: number) => {
    setHadithRefs(hadithRefs.filter((_, i) => i !== idx));
  };

  const submitLessonPlan = async (status: "DRAFT" | "SUBMITTED") => {
    if (!title.trim() || !subject.trim()) {
      toast.error("عنوان و موضوع طرح درس الزامی است");
      return;
    }

    const validObjectives = objectives.filter(o => o.trim());
    if (validObjectives.length === 0) {
      toast.error("حداقل یک هدف آموزشی وارد کنید");
      return;
    }

    const validSources = sources.filter(s => s.trim());

    const planData = {
      title: title.trim(),
      subject: subject.trim(),
      grade: grade.trim() || null,
      sessionCount: parseInt(sessionCount) || 1,
      // === اهداف ===
      generalObjective: generalObjective.trim() || null,
      objectives: validObjectives,
      behavioralObjectives: behavioralObjectives.trim() || null,
      // === عناوین فرعی و پیش‌نیازها ===
      subHeadings: subHeadings.trim() || null,
      prerequisites: prerequisites.trim() || null,
      diagnosticEvaluation: diagnosticEvaluation.trim() || null,
      // === مراحل اجرای تدریس ===
      preparationPhase: preparationPhase.trim() || null,
      introductionPhase: introductionPhase.trim() || null,
      presentationPhase: presentationPhase.trim() || null,
      summaryPhase: summaryPhase.trim() || null,
      evaluationPhase: evaluationPhase.trim() || null,
      supplementaryActivities: supplementaryActivities.trim() || null,
      // === روش و ابزار ===
      teachingMethod: teachingMethod.trim() || null,
      teachingAids: teachingAids.trim() || null,
      evaluationQuestions: evaluationQuestions.trim() || null,
      // === legacy ===
      contentOutline: contentOutline.trim() || null,
      evaluationMethod: evaluationMethod.trim() || null,
      sources: validSources,
      quranRefs,
      hadithRefs: hadithRefs.filter(h => h.text.trim()),
      status,
    };

    try {
      await apiFetch("/api/lesson-plans", {
        method: "POST",
        body: JSON.stringify(planData),
      });

      toast.success(status === "DRAFT" ? "طرح درس به‌عنوان پیش‌نویس ذخیره شد" : "طرح درس با موفقیت ارسال شد");
      onSubmitted();
    } catch (err: any) {
      // Server unavailable - save locally
      try {
        await savePendingLessonPlan(planData);
        toast.success(
          status === "DRAFT"
            ? "طرح درس به‌صورت محلی ذخیره شد (سرور در دسترس نیست)"
            : "طرح درس محلی ذخیره شد — وقتی سرور در دسترس شود، به‌صورت خودکار ارسال می‌شود",
          { duration: 6000 }
        );

        setTimeout(() => {
          syncNow().catch(() => {});
        }, 500);

        onSubmitted();
      } catch (localErr: any) {
        toast.error("خطا در ثبت طرح درس (و در ذخیره محلی): " + localErr.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          ثبت طرح درس
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          طرح درس آموزشی خود را با ساختار استاندارد ثبت کنید
        </p>
      </div>

      {/* اطلاعات پایه */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">اطلاعات پایه</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان طرح درس *</Label>
            <Input
              id="title"
              placeholder="مثلاً: طرح درس تفسیر آیه ۵ سوره فاتحه"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">موضوع *</Label>
              <Input
                id="subject"
                placeholder="مثلاً: تفسیر قرآن"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">پایه / گروه مخاطب</Label>
              <Input
                id="grade"
                placeholder="مثلاً: بزرگسالان - سطح متوسط"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionCount">تعداد جلسات</Label>
              <Input
                id="sessionCount"
                type="number"
                min="1"
                value={sessionCount}
                onChange={(e) => setSessionCount(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* اهداف آموزشی (طبق سند: کلی، جزئی، رفتاری) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">اهداف آموزشی (طبق سند نهضت)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* هدف کلی */}
          <div className="space-y-2">
            <Label htmlFor="generalObjective">هدف کلی درس *</Label>
            <Textarea
              id="generalObjective"
              placeholder="مثلاً: متربیان با مفهوم مقاومت و کاربرد آن آشنا شوند"
              value={generalObjective}
              onChange={(e) => setGeneralObjective(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">بر اساس سند: هدف کلی باید در یک جمله و قابل اندازه‌گیری بیان شود</p>
          </div>

          {/* اهداف جزئی */}
          <div className="space-y-2">
            <Label>اهداف جزئی درس</Label>
            <p className="text-xs text-muted-foreground">بر اساس هر عنوان فرعی، یک هدف جزئی بنویسید</p>
            <div className="space-y-2">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder={`هدف جزئی ${idx + 1}`}
                    value={obj}
                    onChange={(e) => updateObjective(idx, e.target.value)}
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeObjective(idx)} disabled={objectives.length === 1}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={addObjective}>
              <Plus className="w-4 h-4 ml-1" />
              افزودن هدف جزئی
            </Button>
          </div>

          {/* اهداف رفتاری */}
          <div className="space-y-2">
            <Label htmlFor="behavioralObjectives">اهداف رفتاری (با عملکرد، شرایط، معیار)</Label>
            <Textarea
              id="behavioralObjectives"
              placeholder={"مثلاً:\n۱- مفهوم مقاومت را در چند جمله بیان کنند (شناختی-دانش)\n۲- تأثیر افزایش و کاهش مقاومت را توضیح دهند (شناختی-درک)"}
              value={behavioralObjectives}
              onChange={(e) => setBehavioralObjectives(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">بر اساس سند: هر هدف رفتاری باید دارای «نوع رفتار، شرایط، معیار» باشد</p>
          </div>
        </CardContent>
      </Card>

      {/* عناوین فرعی و پیش‌نیازها */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">عناوین فرعی و پیش‌نیازها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subHeadings">عناوین فرعی و رئوس مطالب</Label>
            <Textarea
              id="subHeadings"
              placeholder={"مثلاً:\n۱- مفهوم مقاومت\n۲- کاربرد مقاومت در زندگی\n۳- انجام آزمایش"}
              value={subHeadings}
              onChange={(e) => setSubHeadings(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">بر اساس سند: عناوین فرعی با توالی و ترتیب مناسب</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prerequisites">رفتار ورودی (پیش‌نیازها)</Label>
            <Textarea
              id="prerequisites"
              placeholder="مثلاً: متربیان برای فهم درس جدید باید با مفهوم رسانا و نارسانا آشنا باشند"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosticEvaluation">ارزشیابی تشخیصی (سؤال‌های پیش‌نیاز)</Label>
            <Textarea
              id="diagnosticEvaluation"
              placeholder={"مثلاً:\n۱- سه نوع از اشیای رسانا را نام ببرید\n۲- جریان الکتریکی را توضیح دهید"}
              value={diagnosticEvaluation}
              onChange={(e) => setDiagnosticEvaluation(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">بر اساس سند: سؤال‌هایی برای سنجش پیش‌نیازها قبل از تدریس</p>
          </div>
        </CardContent>
      </Card>

      {/* مراحل اجرای تدریس (طبق سند) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">مراحل اجرای تدریس (طبق سند نهضت)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preparationPhase">مرحله آمادگی (مربی و متربی)</Label>
            <Textarea
              id="preparationPhase"
              placeholder="فعالیت‌های آمادگی مربی و آمادگی متربی"
              value={preparationPhase}
              onChange={(e) => setPreparationPhase(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="introductionPhase">مرحله معرفی و بیان اهداف صریح</Label>
            <Textarea
              id="introductionPhase"
              placeholder="نحوه معرفی درس و بیان اهداف به متربیان"
              value={introductionPhase}
              onChange={(e) => setIntroductionPhase(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="presentationPhase">مرحله ارائه درس</Label>
            <Textarea
              id="presentationPhase"
              placeholder={"محتوا، روش و زمان‌بندی ارائه\nسؤال‌های پیش‌بینی‌شده\nنمونه‌ها و مثال‌ها"}
              value={presentationPhase}
              onChange={(e) => setPresentationPhase(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summaryPhase">مرحله خلاصه و نتیجه‌گیری</Label>
            <Textarea
              id="summaryPhase"
              placeholder="جمع‌بندی و نتیجه‌گیری توسط متربیان"
              value={summaryPhase}
              onChange={(e) => setSummaryPhase(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evaluationPhase">مرحله ارزشیابی پایانی</Label>
            <Textarea
              id="evaluationPhase"
              placeholder="شیوه ارزشیابی (کتبی، شفاهی، عملی)"
              value={evaluationPhase}
              onChange={(e) => setEvaluationPhase(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplementaryActivities">فعالیت‌های تکمیلی</Label>
            <Textarea
              id="supplementaryActivities"
              placeholder="فعالیت‌های خارج از حلقه برای تقویت یادگیری"
              value={supplementaryActivities}
              onChange={(e) => setSupplementaryActivities(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* روش و ابزار */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">روش و ابزار تدریس</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teachingMethod">روش تدریس</Label>
            <Textarea
              id="teachingMethod"
              placeholder="مثلاً: روش توضیحی، پرسش و پاسخ، آزمایشگاهی"
              value={teachingMethod}
              onChange={(e) => setTeachingMethod(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teachingAids">وسایل آموزشی</Label>
            <Textarea
              id="teachingAids"
              placeholder="مثلاً: مولد، آمپرسنج، ولت‌سنج، لامپ، کتاب درسی"
              value={teachingAids}
              onChange={(e) => setTeachingAids(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evaluationQuestions">سؤال‌های ارزشیابی پایانی</Label>
            <Textarea
              id="evaluationQuestions"
              placeholder={"مثلاً:\n۱- مقاومت الکتریکی را تعریف کنید\n۲- علت افزایش و کاهش جریان را توضیح دهید"}
              value={evaluationQuestions}
              onChange={(e) => setEvaluationQuestions(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* آیات قرآن */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              آیات قرآن مرتبط
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowQuranSearch(!showQuranSearch)}>
              <Plus className="w-4 h-4 ml-1" />
              جستجو و افزودن
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {showQuranSearch && (
            <div className="space-y-2 p-3 rounded-lg bg-muted/50">
              <div className="flex gap-2">
                <Input
                  placeholder="جستجو در متن آیات (مثلاً: السابقون)"
                  value={quranQuery}
                  onChange={(e) => setQuranQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchQuran()}
                />
                <Button onClick={searchQuran} disabled={searchingQuran}>
                  {searchingQuran ? "..." : "جستجو"}
                </Button>
              </div>
              {quranResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {quranResults.map((v) => (
                    <div
                      key={v.id}
                      className="p-2 rounded-lg border bg-background cursor-pointer hover:bg-muted/50"
                      onClick={() => addQuranRef(v)}
                    >
                      <div className="text-xs text-muted-foreground">{v.surahNameFa} {v.surah}:{v.ayah}</div>
                      <div className="font-arabic text-right" dir="rtl">{v.textUthmani}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {quranRefs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              هنوز آیه‌ای اضافه نشده است
            </p>
          ) : (
            <div className="space-y-2">
              {quranRefs.map((ref, idx) => (
                <div key={idx} className="flex items-start justify-between p-2 rounded-lg border bg-muted/30">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{ref.surahName} {ref.surah}:{ref.ayah}</div>
                    <div className="font-arabic text-right mt-1" dir="rtl">{ref.text}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeQuranRef(idx)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* روایات مرتبط */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>روایات مرتبط</span>
            <Button size="sm" variant="outline" onClick={addHadithRef}>
              <Plus className="w-4 h-4 ml-1" />
              افزودن
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hadithRefs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              هنوز روایتی اضافه نشده است
            </p>
          ) : (
            hadithRefs.map((ref, idx) => (
              <div key={idx} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="منبع (الکافی، من لا یحضره الفقیه، ...)"
                    value={ref.source}
                    onChange={(e) => updateHadithRef(idx, "source", e.target.value)}
                  />
                  <Input
                    placeholder="ارجاع (مثلاً: ج ۲، ص ۱۲۳)"
                    value={ref.reference}
                    onChange={(e) => updateHadithRef(idx, "reference", e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="متن روایت"
                    value={ref.text}
                    onChange={(e) => updateHadithRef(idx, "text", e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeHadithRef(idx)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* منابع */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>منابع</span>
            <Button size="sm" variant="outline" onClick={addSource}>
              <Plus className="w-4 h-4 ml-1" />
              افزودن منبع
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sources.map((src, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder={`منبع ${idx + 1}: مثلاً المیزان، الکافی، ...`}
                value={src}
                onChange={(e) => updateSource(idx, e.target.value)}
              />
              <Button size="sm" variant="ghost" onClick={() => removeSource(idx)} disabled={sources.length === 1}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end sticky bottom-4 bg-background p-3 rounded-lg border shadow-lg">
        <Button variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button variant="secondary" onClick={() => submitLessonPlan("DRAFT")}>
          <Save className="w-4 h-4 ml-1" />
          ذخیره پیش‌نویس
        </Button>
        <Button onClick={() => submitLessonPlan("SUBMITTED")}>
          <Send className="w-4 h-4 ml-1" />
          ارسال برای ارزیابی
        </Button>
      </div>
    </div>
  );
}
