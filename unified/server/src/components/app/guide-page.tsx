"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ClipboardList, FileText, ChevronDown, ChevronUp } from "lucide-react";

export function GuidePage() {
  const [activeSection, setActiveSection] = useState<string | null>("report-structure");

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          راهنمای گزارش‌نویسی و طرح‌درس‌نویسی
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          بر اساس اسناد نهضت تربیتی حضرت سیدالشهدا علیه‌السلام
        </p>
      </div>

      {/* بخش گزارش‌نویسی */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            اصول و روش گزارش‌نویسی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <GuideSection
            id="report-structure"
            title="ساختار گزارش روزانه"
            active={activeSection === "report-structure"}
            onToggle={toggleSection}
            items={[
              { title: "عنوان گزارش", desc: "شامل موضوع، تاریخ، نویسنده و جایگاه — «عنوان گزارش، شروع مسیر»" },
              { title: "چکیده گزارش", desc: "نکات مهم، توصیه‌ها و نتیجه‌گیری‌ها — «چشمگیرترین بخش کار». کوتاه و شفاف." },
              { title: "بدنه گزارش", desc: "اصلی‌ترین بخش. تقسیم‌بندی موضوعات با توضیحات کامل هر بخش." },
              { title: "توصیه‌ها", desc: "پیشنهادات کاربردی برای ادامه کار — «راهی برای بهبود پروژه»" },
            ]}
          />
          <GuideSection
            id="report-patterns"
            title="الگوهای گزارش‌نویسی"
            active={activeSection === "report-patterns"}
            onToggle={toggleSection}
            items={[
              { title: "الگوی تقدّم زمانی", desc: "ارائه بر اساس زمان انجام کار (تایم‌لاین)" },
              { title: "الگوی قیاسی", desc: "ابتدا نتیجه و تصمیم‌گیری، سپس دلایل" },
              { title: "الگوی استقرایی", desc: "ابتدا دلایل و مشکلات، سپس نتیجه و راه‌حل" },
            ]}
          />
          <GuideSection
            id="report-styles"
            title="سبک‌های گزارش"
            active={activeSection === "report-styles"}
            onToggle={toggleSection}
            items={[
              { title: "توصیفی", desc: "توالی وقایع و اتفاقات با دقت و صحت — پایه گزارش‌های تحلیلی" },
              { title: "تحلیلی", desc: "بررسی چرایی موضوع، ابعاد اساسی، تحلیل داده‌ها" },
              { title: "انتقادی", desc: "ارزیابی نقاط قوت و ضعف یک موضوع" },
              { title: "تجویزی", desc: "ارائه پیشنهاد و راهکار پس از بررسی نقطاط قوت و ضعف" },
            ]}
          />
          <GuideSection
            id="report-principles"
            title="اصول مهم گزارش‌نویسی"
            active={activeSection === "report-principles"}
            onToggle={toggleSection}
            items={[
              { title: "دقت محتوایی و نگارشی", desc: "کافی و دقیق، بدون غلط املایی یا نگارشی" },
              { title: "ظاهر حرفه‌ای", desc: "کاملاً حرفه‌ای — خلق هنری نیست، اما حرفه‌ای است" },
              { title: "بهره‌وری", desc: "استفاده از ابزارها و فرمول‌ها برای تسریع" },
              { title: "ثبات ساختار", desc: "پیروی کلیات گزارش‌های قبلی مشابه" },
              { title: "کاربردی بودن", desc: "کمک به تصمیم‌گیری، کاملاً مرتبط با موضوع" },
            ]}
          />
        </CardContent>
      </Card>

      {/* بخش طرح‌درس‌نویسی */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            اصول و روش طرح‌درس‌نویسی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <GuideSection
            id="lp-elements"
            title="عناصر پایه طرح درس"
            active={activeSection === "lp-elements"}
            onToggle={toggleSection}
            items={[
              { title: "موضوع/عنوان درس", desc: "دقیق و مشخص (مثلاً: مقاومت الکتریکی)" },
              { title: "عناوین فرعی", desc: "با توالی و ترتیب مناسب — راهنمای نگارش اهداف جزئی" },
            ]}
          />
          <GuideSection
            id="lp-objectives"
            title="اهداف (کلی، جزئی، رفتاری)"
            active={activeSection === "lp-objectives"}
            onToggle={toggleSection}
            items={[
              { title: "هدف کلی", desc: "در یک جمله، قابل اندازه‌گیری. مثلاً: متربیان با مفهوم ... آشنا شوند" },
              { title: "اهداف جزئی", desc: "بر اساس هر عنوان فرعی — زیرمجموعه هدف کلی" },
              { title: "اهداف رفتاری", desc: "باید دارای سه ویژگی باشد: ۱- نوع رفتار ۲- شرایط ۳- معیار" },
            ]}
          />
          <GuideSection
            id="lp-prerequisites"
            title="پیش‌نیازها و ارزشیابی تشخیصی"
            active={activeSection === "lp-prerequisites"}
            onToggle={toggleSection}
            items={[
              { title: "رفتار ورودی (پیش‌نیازها)", desc: "دانسته‌ها و مهارت‌های لازم قبل از درس جدید" },
              { title: "ارزشیابی تشخیصی", desc: "سؤال‌هایی برای سنجش پیش‌نیازها قبل از تدریس" },
            ]}
          />
          <GuideSection
            id="lp-phases"
            title="مراحل اجرای تدریس"
            active={activeSection === "lp-phases"}
            onToggle={toggleSection}
            items={[
              { title: "مرحله آمادگی", desc: "آمادگی مربی (برنامه‌ریزی) و آمادگی متربی (جلب توجه)" },
              { title: "مرحله معرفی", desc: "معرفی درس و بیان اهداف صریح — ۳ تا ۵ دقیقه" },
              { title: "مرحله ارائه", desc: "محتوا، روش، زمان‌بندی، سؤال‌های پیش‌بینی‌شده" },
              { title: "مرحله خلاصه", desc: "جمع‌بندی توسط متربیان — تثبیت مطالب" },
              { title: "مرحله ارزشیابی", desc: "بر اساس اهداف رفتاری — کتبی یا شفاهی" },
              { title: "فعالیت‌های تکمیلی", desc: "خارج از حلقه برای تقویت یادگیری" },
            ]}
          />
          <GuideSection
            id="lp-method-tools"
            title="روش و ابزار تدریس"
            active={activeSection === "lp-method-tools"}
            onToggle={toggleSection}
            items={[
              { title: "روش تدریس", desc: "توضیحی، پرسش و پاسخ، آزمایشگاهی، بحث گروهی و ..." },
              { title: "وسایل آموزشی", desc: "وسایل حامل پیام‌های آموزشی (فیلم، کتاب، ابزار)" },
              { title: "سؤال‌های ارزشیابی", desc: "بر اساس اهداف رفتاری، خارج از اهداف نباشند" },
            ]}
          />
        </CardContent>
      </Card>

      {/* نکات کلیدی */}
      <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900">
        <CardContent className="p-4">
          <h3 className="font-medium text-emerald-700 dark:text-emerald-300 mb-2">نکات کلیدی</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• طرح درس چارچوب پیش‌بینی است، نه سناریوی مفصل تدریس</li>
            <li>• تفاوت مربی متخصص و غیرمتخصص: اندیشیدن به فرآیند و نتایج</li>
            <li>• «تدریس بدون برنامه از قبل، کاری کورکورانه است»</li>
            <li>• «طراحی بدون اجرا، فعالیتی بی‌ثمر است»</li>
            <li>• تکرار از راهبردهای اساسی در میراث تربیتی است</li>
            <li>• حل مسئله و کاوشگری، یادگیری مؤثرتر و لذت‌بخش‌تر می‌سازد</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function GuideSection({
  id,
  title,
  items,
  active,
  onToggle,
}: {
  id: string;
  title: string;
  items: { title: string; desc: string }[];
  active: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="border rounded-lg">
      <Button
        variant="ghost"
        className="w-full justify-between p-3 h-auto"
        onClick={() => onToggle(id)}
      >
        <span className="font-medium text-sm">{title}</span>
        {active ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>
      {active && (
        <div className="px-3 pb-3 space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="border-r-2 border-emerald-300 dark:border-emerald-700 pr-3 py-1">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
