"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/app-constants";
import { Loader2, Lock, Key, User, Shield } from "lucide-react";
import { toast } from "sonner";

interface SettingsProps {
  user: any;
}

export function Settings({ user }: SettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("همه فیلدها را پر کنید");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("رمز جدید و تأیید آن یکسان نیستند");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("رمز جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("خطا در تغییر رمز: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold">تنظیمات حساب کاربری</h2>
        <p className="text-sm text-muted-foreground mt-1">
          مدیریت حساب و امنیت
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            اطلاعات کاربری
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">نام:</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">شماره تلفن:</span>
            <span className="font-mono" dir="ltr">{user.phone}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">نقش:</span>
            <span className="font-medium">
              {user.role === "INSTRUCTOR" ? "مربی" :
               user.role === "BRANCH_MANAGER" ? "مسئول شعبه" :
               user.role === "CENTRAL_SUPERVISOR" ? "مسئول مرکزی" :
               user.role === "ADMIN" ? "مدیر سیستم" : user.role}
            </span>
          </div>
          {user.branch && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">شعبه:</span>
              <span className="font-medium">{user.branch.name}</span>
            </div>
          )}
          {user.role === "INSTRUCTOR" && (
            <>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">امتیاز انباشتی:</span>
                <span className="font-bold text-emerald-600">{user.totalPoints}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">تعداد تقدیرها:</span>
                <span className="font-medium">{user.recognitionsCount}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" />
            تغییر رمز عبور
          </CardTitle>
          <CardDescription>
            برای امنیت بیشتر، رمز عبور خود را به‌صورت دوره‌ای تغییر دهید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">رمز عبور فعلی</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">رمز عبور جدید (حداقل ۶ کاراکتر)</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">تأیید رمز عبور جدید</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving} className="w-full">
            {saving ? (
              <><Loader2 className="w-4 h-4 ml-2 animate-spin" />در حال تغییر...</>
            ) : (
              <><Key className="w-4 h-4 ml-2" />تغییر رمز عبور</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Security info */}
      <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div className="text-sm space-y-1">
              <div className="font-medium text-emerald-700 dark:text-emerald-300">اطلاعات امنیتی</div>
              <ul className="text-muted-foreground space-y-0.5 mr-3">
                <li>• رمزهای عبور با الگوریتم bcrypt هش می‌شوند</li>
                <li>• نشست‌ها پس از ۲۴ ساعت منقضی می‌شوند</li>
                <li>• توکن‌های نشست به‌صورت امن تولید می‌شوند</li>
                <li>• توصیه می‌شود رمز عبور قوی و منحصر به‌فرد انتخاب کنید</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
