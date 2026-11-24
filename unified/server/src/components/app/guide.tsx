"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";

interface GuideProps {
  user: any;
}

export function Guide({ user }: GuideProps) {
  const [activeSection, setActiveSection] = useState<string | null>("report-structure");

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold">راهنمای گزارش‌نویسی و طرح‌درس‌نویسی</h2>
        <p className="text-sm text-muted-foreground mt-1">
          بر اساس اسناد نهضت تربیتی حضرت سیدالشهدا علیه‌السلام
        </p>
      </div>

      {/* معرفی */}
      <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900">
        <CardContent className="p-4">
          <p className="text-sm">
            این راهنما بر اساس دو سند رسمی نهضت تدوین شده است:
          </p>
          <ul className="text-sm space-y-1 mt-2 mr-4">
            <li>• «اصول و روش گزارش‌نویسی» — گردآوری: حسین اسدنژاد پروچ</li>
            <li>• «طرح‌درس‌نویسی، اصول و روش‌ها» — مکتب جناب جون سلام‌الله علیه</li>
          </ul>
        </CardContent>
      </Card>

      {/* بخش گزارش‌نویسی */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            اصول و روش گزارش‌نویسی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            گزارش روزانه، خلاصه‌ای از فعالیت روزِ هر مکتب است — از زمان ورود تا زمان خروج، با آموزش و تربیت مرتبط.
            گزارش‌نویسی باعث انتقال تجربه‌ها، مدیریت دانش، و تصمیم‌گیری درست می‌شود.
          </p>

          {/* الگوهای گزارش‌نویسی */}
          <div className="border rounded-lg">
            <button
              className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/30"
              onClick={() => toggleSection("report-patterns")}
            >
              <span className="font-medium text-sm">الگوهای گزارش‌نویسی (۳ الگو)</span>
              {activeSection === "report-patterns" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSection === "report-patterns" && (
              <div className="p-3 border-t text-sm space-y-2">
                <div><strong>۱. الگوی تقدّم زمانی (تایم‌لاین):</strong> اطلاعات بر اساس زمان انجام کارها ارائه می‌شود.</div>
                <div><strong>۲. الگوی قیاسی:</strong> ابتدا تصمیم‌گیری‌ها و نتیجه ارائه می‌شود، سپس دلایل.</div>
                <div><strong>۳. الگوی استقرایی:</strong> ابتدا دلایل و مشکلات، سپس نتیجه و راه حل.</div>
              </div>
            )}
          </div>

          {/* سبک‌های گزارش‌نویسی */}
          <div className="border rounded-lg">
            <button
              className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/30"
              onClick={() => toggleSection("report-styles")}
            >
              <span className="font-medium text-sm">سبک‌های گزارش‌نویسی (۴ سبک)</span>
              {activeSection === "report-styles" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSection === "report-styles" && (
              <div className="p-3 border-t text-sm space-y-2">
                <div><strong>۱. توصیفی:</strong> توصیف دقیق اتفاقات و وقایع با صحت داده‌ها.</div>
                <div><strong>۲. تحلیلی:</strong> بررسی چرایی موضوع و ابعاد اساسی.</div>
                <div><strong>۳. انتقادی:</strong> ارزیابی جوانب مثبت و منفی، نقاط ضعف و قوت.</div>
                <div><strong>۴. تجویزی:</strong> ارائه پیشنهادات و راهکارها پس از بررسی.</div>
              </div>
            )}
          </div>

          {/* ساختار گزارش */}
          <div className="border rounded-lg">
            <button
              className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/30"
              onClick={() => toggleSection("report-structure")}
            >
              <span className="font-medium text-sm">ساختار گزارش (۴ بخش اصلی)</span>
              {activeSection === "report-structure" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSection === "report-structure" && (
              <div className="p-3 border-t text-sm space-y-3">
                <div>
                  <strong>۱. عنوان گزارش (شروع مسیر):</strong>
                  <p className="text-muted-foreground mt-1">شامل موضوع، تاریخ، نویسنده، و در صورت لزوم مکان.</p>
                </div>
                <div>
                  <strong>۲. چکیده گزارش (چشمگیرترین بخش کار):</strong>
                  <p className="text-muted-foreground mt-1">خلاصه‌ای از نکات مهم، توصیه‌ها و نتیجه‌گیری‌ها — کوتاه و شفاف.</p>
                </div>
                <div>
                  <strong>۳. بدنه‌ی گزارش (اصلی‌ترین بخش):</strong>
                  <p className="text-muted-foreground mt-1">تقسیم‌بندی موضوعی، هر بخش با توضیحات کامل.</p>
                </div>
                <div>
                  <strong>۴. توصیه‌ها (راهی برای بهبود پروژه):</strong>
                  <p className="text-muted-foreground mt-1">پیشنهادات کاربردی برای ادامه کار.</p>
                </div>
              </div>
            )}
          </div>

          {/* اصول مهم */}
          <div className="border rounded-lg">
            <button
              className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/30"
              onClick={() => toggleSection("report-principles")}
            >
              <span className="font-medium text-sm">اصول مهم در گزارش‌نویسی</span>
              {activeSection === "report-principles" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSection === "report-principles" && (
              <div className="p-3 border-t text-sm space-y-2">
                <div>• <strong>دقت محتوایی و نگارشی:</strong> گزارش باید کافی و دقیق باشد، بدون غلط املایی.</div>
                <div>• <strong>ظاهر حرفه‌ای:</strong> ظاهر گزارش بسیار مهم است.</div>
                <div>• <strong>بهره‌وری:</strong> از ابزارها و فرمول‌ها برای تسریع استفاده کنید.</div>
                <div>• <strong>ثبات ساختار:</strong> ساختار با گزارش‌های قبلی مشابه باشد.</div>
                <div>• <strong>کاربردی بودن:</strong> محتوا به تصمیم‌گیری کمک کند.</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* بخش طرح‌درس‌نویسی */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            اصول و روش طرح‌درس‌نویسی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            طرح درس روزانه، مجموعه‌ای از فعالیت‌های پیش‌بینی‌شده شامل تربیتی، آموزشی و مهارتی است که برای رسیدن به یک یا چند هدف،
            پیش از تدریس توسط مربی تدارک دیده می‌شود.
          </p>

          {/* مراحل نگارش طرح درس */}
          <div className="border rounded-lg">
            <button
              className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/30"
              onClick={() => toggleSection("lesson-steps")}
            >
              <span className="font-medium text-sm">مراحل نگارش و تنظیم طرح درس</span>
              {activeSection === "lesson-steps" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSection === "lesson-steps" && (
              <div className="p-3 border-t text-sm space-y-2">
                <div><strong>۱. موضوع یا عنوان درس:</strong> دقیق و مشخص.</div>
                <div><strong>۲. عناوین فرعی (رئوس مطالب):</strong> با توالی و ترتیب مناسب.</div>
                <div><strong>۳. هدف کلی:</strong> در یک جمله، قابل اندازه‌گیری.</div>
                <div><strong>۴. اهداف جزئی:</strong> بر اساس هر عنوان فرعی.</div>
                <div><strong>۵. اهداف رفتاری:</strong> با سه ویژگی: نوع رفتار، شرایط، معیار.</div>
                <div><strong>۶. رفتار ورودی (پیش‌نیازها):</strong> دانش قبلی لازم.</div>
                <div><strong>۷. ارزشیابی تشخیصی:</strong> سؤال‌های سنجش پیش‌نیازها.</div>
                <div><strong>۸. مراحل اجرای تدریس:</strong> آمادگی، معرفی، ارائه، خلاصه، ارزشیابی، تکمیلی.</div>
                <div><strong>۹. روش تدریس:</strong> توضیحی، پرسش و پاسخ، آزمایشگاهی و...</div>
                <div><strong>۱۰. وسایل آموزشی:</strong> وسایل مورد نیاز.</div>
                <div><strong>۱۱. ارزشیابی پایانی:</strong> بر اساس اهداف رفتاری.</div>
                <div><strong>۱۲. فعالیت‌های تکمیلی:</strong> برای تقویت یادگیری.</div>
              </div>
            )}
          </div>

          {/* مراحل اجرای تدریس */}
          <div className="border rounded-lg">
            <button
              className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/30"
              onClick={() => toggleSection("lesson-phases")}
            >
              <span className="font-medium text-sm">مراحل اجرای تدریس (۶ مرحله)</span>
              {activeSection === "lesson-phases" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSection === "lesson-phases" && (
              <div className="p-3 border-t text-sm space-y-3">
                <div>
                  <strong>الف) مرحله آمادگی:</strong>
                  <p className="text-muted-foreground mt-1">آمادگی مربی (چه فعالیتی، چگونه شروع، چگونه انگیزه) و آمادگی متربی.</p>
                </div>
                <div>
                  <strong>ب) مرحله معرفی و بیان اهداف صریح:</strong>
                  <p className="text-muted-foreground mt-1">معرفی درس و اهداف به متربیان (۳-۵ دقیقه).</p>
                </div>
                <div>
                  <strong>ج) مرحله ارائه درس:</strong>
                  <p className="text-muted-foreground mt-1">محتوای مشخص، روش آموزش، زمان‌بندی، سؤال‌های پیش‌بینی‌شده.</p>
                </div>
                <div>
                  <strong>د) مرحله خلاصه و نتیجه‌گیری:</strong>
                  <p className="text-muted-foreground mt-1">جمع‌بندی توسط متربیان، نه مربی.</p>
                </div>
                <div>
                  <strong>هـ) مرحله ارزشیابی:</strong>
                  <p className="text-muted-foreground mt-1">سؤال‌ها بر اساس اهداف رفتاری.</p>
                </div>
                <div>
                  <strong>و) مرحله فعالیت‌های تکمیلی:</strong>
                  <p className="text-muted-foreground mt-1">تکالیف خارج از حلقه برای تقویت یادگیری.</p>
                </div>
              </div>
            )}
          </div>

          {/* اهداف رفتاری */}
          <div className="border rounded-lg">
            <button
              className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/30"
              onClick={() => toggleSection("behavioral-objectives")}
            >
              <span className="font-medium text-sm">ویژگی‌های اهداف رفتاری</span>
              {activeSection === "behavioral-objectives" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSection === "behavioral-objectives" && (
              <div className="p-3 border-t text-sm space-y-2">
                <div>اهداف رفتاری باید دارای سه ویژگی باشند:</div>
                <div>• <strong>نوع رفتار:</strong> دقیقاً مشخص باشد (مثلاً: بیان کند، بنویسد، انجام دهد).</div>
                <div>• <strong>شرایط:</strong> انجام رفتار دقیقاً مشخص باشد (مثلاً: در حلقه، با کتاب).</div>
                <div>• <strong>معیار:</strong> درجه رفتار دقیقاً معین شود (مثلاً: در ۲ سطر، در یک بند).</div>
                <div className="mt-2 p-2 rounded bg-muted/30">
                  <strong>مثال:</strong> «متربی بتواند مفهوم مقاومت را در چند جمله بیان کند.»
                  <br />
                  نوع رفتار: بیان کردن | شرایط: در حلقه | معیار: چند جمله
                </div>
              </div>
            )}
          </div>

          {/* عناصر طرح درس خوب */}
          <div className="border rounded-lg">
            <button
              className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/30"
              onClick={() => toggleSection("good-lesson-plan")}
            >
              <span className="font-medium text-sm">عناصر و ارکان طرح درس خوب</span>
              {activeSection === "good-lesson-plan" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSection === "good-lesson-plan" && (
              <div className="p-3 border-t text-sm space-y-1">
                <div>• موضوع و هدف کلی</div>
                <div>• عناوین فرعی یا رئوس مطالب</div>
                <div>• اهداف جزئی و رفتاری</div>
                <div>• رفتار ورودی متربیان</div>
                <div>• ارزشیابی تشخیصی</div>
                <div>• وسایل و روش تدریس</div>
                <div>• مراحل اجرای تدریس</div>
                <div>• ارزشیابی پایانی</div>
                <div>• فعالیت‌های تکمیلی</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* پیام نهضت */}
      <Card className="bg-gradient-to-l from-emerald-50 to-amber-50 dark:from-emerald-950/20 dark:to-amber-950/20 border-emerald-200 dark:border-emerald-900">
        <CardContent className="p-6 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-medium">
            «تدریس، بدون برنامه‌ای از قبل طراحی‌شده، کاری کورکورانه است؛
            و طراحی بدون اجرا، فعالیتی بی‌ثمر است که تنها زینت‌بخش صفحات کاغذ خواهد بود.»
          </p>
          <p className="text-xs text-muted-foreground mt-2">— از سند طرح‌درس‌نویسی نهضت</p>
        </CardContent>
      </Card>
    </div>
  );
}
