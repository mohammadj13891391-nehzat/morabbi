"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, KeyRound, UserCheck, LogIn, HelpCircle } from "lucide-react";

export function RegistrationGuide() {
  const steps = [
    {
      icon: UserPlus,
      title: "۱. تکمیل فرم ثبت‌نام",
      desc: "نام، کد ملی، شماره تلفن و نقش خود را وارد کنید. شعبه و مکتب هم می‌توانید انتخاب کنید.",
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
    {
      icon: KeyRound,
      title: "۲. دریافت رمز عبور",
      desc: "رمز عبور شما = ۶ رقم آخر کد ملی. این رمز پس از ثبت‌نام نمایش داده می‌شود.",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    },
    {
      icon: UserCheck,
      title: "۳. تأیید مسئول",
      desc: "ثبت‌نام شما در انتظار تأیید مسئول است. مسئول نقش شما را بررسی و تأیید می‌کند.",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    },
    {
      icon: LogIn,
      title: "۴. ورود به سامانه",
      desc: "پس از تأیید، با شماره تلفن و رمز (۶ رقم آخر کد ملی) وارد شوید. سپس رمز را تغییر دهید.",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          راهنمای ثبت‌نام و ورود
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${step.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{step.desc}</div>
              </div>
            </div>
          );
        })}

        <div className="pt-3 border-t space-y-2">
          <div className="text-xs text-muted-foreground">نقش‌های قابل انتخاب:</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">مربی</Badge>
            <Badge variant="outline" className="text-xs">مربی یار</Badge>
            <Badge variant="outline" className="text-xs">ارزیاب</Badge>
            <Badge variant="outline" className="text-xs">مسئول شعبه</Badge>
            <Badge variant="outline" className="text-xs">مسئول مهارتی برادران</Badge>
            <Badge variant="outline" className="text-xs">مسئول مهارتی خواهران</Badge>
            <Badge variant="outline" className="text-xs">مسئول</Badge>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">مکتب‌ها:</div>
          <div className="text-xs space-y-0.5">
            <div>📌 مکتب حضرت علی اصغر (ع) ← شعبه شهید بهشتی</div>
            <div>📌 مکتب حضرت قاسم (ع) ← شعبه شهید باهنر + شهید صدر</div>
            <div>📌 مکتب حضرت رقیه (س) ← شعبه بانو حدادیان</div>
            <div>📌 مکتب حضرت سکینه (س) ← شعبه بانو طاهایی + بانو امین</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
