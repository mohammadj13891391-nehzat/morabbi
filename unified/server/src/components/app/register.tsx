"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, REGISTRATION_ROLES } from "@/lib/app-constants";
import { Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface RegisterProps {
  onBack: () => void;
}

export function Register({ onBack }: RegisterProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");

  // Fields
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [requestedRole, setRequestedRole] = useState("");
  const [branchId, setBranchId] = useState("");
  const [maktabId, setMaktabId] = useState("");

  // Data
  const [branches, setBranches] = useState<any[]>([]);
  const [maktabs, setMaktabs] = useState<any[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [branchRes, maktabRes] = await Promise.all([
        apiFetch("/api/branches"),
        apiFetch("/api/maktabs"),
      ]);
      setBranches(branchRes.branches || []);
      setMaktabs(maktabRes.maktabs || []);
    } catch {
      // silent fail
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nationalId || !phone || !requestedRole) {
      toast.error("نام، کد ملی، تلفن و نقش الزامی است");
      return;
    }
    if (!/^\d{10}$/.test(nationalId)) {
      toast.error("کد ملی باید ۱۰ رقم باشد");
      return;
    }
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره تلفن باید با ۰۹ شروع شود و ۱۱ رقم باشد");
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name, nationalId, phone, requestedRole,
          branchId: branchId || undefined,
          maktabId: maktabId || undefined,
        }),
      });

      setLoginPassword(result.loginPassword);
      setSuccess(true);
      if (result.isBootstrap) {
        toast.success("شما اولین کاربر هستید — تأیید خودکار انجام شد!", { duration: 6000 });
      } else {
        toast.success(result.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ثبت‌نام انجام شد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
            <p className="text-sm text-center mb-3">
              {loginPassword && success ? (
                <>
                  ثبت‌نام شما با موفقیت انجام شد.
                  <br />
                  <strong>اکنون می‌توانید وارد شوید.</strong>
                </>
              ) : (
                <>
                  ثبت‌نام شما با موفقیت انجام شد.
                  <br />
                  <strong>پس از تأیید مسئول</strong>، می‌توانید وارد شوید.
                </>
              )}
            </p>

            <div className="border-t border-emerald-200 dark:border-emerald-900 pt-3 mt-3">
              <div className="flex items-center gap-2 justify-center">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">رمز عبور شما:</span>
              </div>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 tracking-widest" dir="ltr">
                  {loginPassword}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                (۶ رقم آخر کد ملی)
                <br />
                پس از ورود، از منوی «تنظیمات» رمز را تغییر دهید
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
              ⏳ وضعیت: <strong>در انتظار تأیید مسئول</strong>
            </p>
          </div>

          <Button className="w-full" onClick={onBack}>
            بازگشت به صفحه ورود
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ثبت‌نام در سامانه</CardTitle>
        <CardDescription>اطلاعات خود را وارد کنید</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام و نام خانوادگی *</Label>
            <Input id="name" placeholder="مثلاً: فاطمه رضایی" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationalId">کد ملی *</Label>
            <Input id="nationalId" placeholder="۱۰ رقم" value={nationalId} onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 10))} required dir="ltr" />
            <p className="text-xs text-muted-foreground">رمز عبور = ۶ رقم آخر کد ملی</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">شماره تلفن همراه *</Label>
            <Input id="phone" placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} required dir="ltr" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">نقش *</Label>
            <Select value={requestedRole} onValueChange={setRequestedRole}>
              <SelectTrigger><SelectValue placeholder="انتخاب نقش..." /></SelectTrigger>
              <SelectContent>
                {REGISTRATION_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">شعبه</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="انتخاب شعبه (اختیاری)..." /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maktab">مکتب</Label>
            <Select value={maktabId} onValueChange={setMaktabId}>
              <SelectTrigger><SelectValue placeholder="انتخاب مکتب (اختیاری)..." /></SelectTrigger>
              <SelectContent>
                {maktabs.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />در حال ثبت‌نام...</> : <>ثبت‌نام</>}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            بازگشت به ورود
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
