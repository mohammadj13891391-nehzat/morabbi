"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/app-constants";

interface LoginProps { onLogin: (user: any, token: string) => void; }

export function Login({ onLogin }: LoginProps) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const doLogin = async (p: string, pw: string) => {
    setLoading(true); setError("");
    try { const data = await apiFetch("/api/auth", { method: "POST", body: JSON.stringify({ phone: p, password: pw }) }); onLogin(data.user, data.token); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  if (showRegister) return <Register onBack={() => setShowRegister(false)} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 dark:from-emerald-950/30 dark:via-background dark:to-amber-950/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white"><span className="text-2xl">📚</span></div>
          <h1 className="text-xl font-bold">نهضت تربیتی حضرت سیدالشهدا علیه‌السلام</h1>
          <p className="text-sm text-muted-foreground">سامانه گزارش و طرح درس روزانه مربیان</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">«وَالسَّابِقُونَ السَّابِقُونَ * أُولَٰئِكَ الْمُقَرَّبُونَ»</p>
        </div>
        <Card>
          <CardHeader><CardTitle>ورود به سامانه</CardTitle><CardDescription>برای ادامه وارد شوید</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); doLogin(phone, password); }} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="phone">شماره تلفن</Label><Input id="phone" type="text" placeholder="09xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" /></div>
              <div className="space-y-2"><Label htmlFor="password">رمز عبور</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" /></div>
              {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "در حال ورود..." : "ورود"}</Button>
            </form>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center mb-2">حساب کاربری ندارید؟</p>
              <Button variant="outline" className="w-full" onClick={() => setShowRegister(true)}>ثبت‌نام در سامانه</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Register({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [requestedRole, setRequestedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [maktabs, setMaktabs] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [maktabId, setMaktabId] = useState("");

  useEffect(() => {
    apiFetch("/api/branches").then(r => setBranches(r.branches || [])).catch(() => {});
    apiFetch("/api/maktabs").then(r => setMaktabs(r.maktabs || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nationalId || !phone || !requestedRole) return;
    setLoading(true);
    try {
      const result = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, nationalId, phone, requestedRole, branchId: branchId || undefined, maktabId: maktabId || undefined }) });
      setLoginPassword(result.loginPassword);
      setSuccess(true);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const [error, setError] = useState("");

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle className="text-lg">ثبت‌نام انجام شد ✅</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
              <p className="text-sm text-center mb-3">ثبت‌نام موفق. اکنون می‌توانید وارد شوید.</p>
              <div className="text-center">
                <div className="text-sm">رمز عبور شما:</div>
                <div className="text-2xl font-bold font-mono text-emerald-700" dir="ltr">{loginPassword}</div>
                <div className="text-xs text-muted-foreground mt-1">(۶ رقم آخر کد ملی)</div>
              </div>
            </div>
            <Button className="w-full" onClick={onBack}>بازگشت به ورود</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader><CardTitle className="text-lg">ثبت‌نام در سامانه</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>نام و نام خانوادگی *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>کد ملی (۱۰ رقم) *</Label><Input value={nationalId} onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 10))} required dir="ltr" /><p className="text-xs text-muted-foreground">رمز = ۶ رقم آخر کد ملی</p></div>
            <div><Label>شماره تلفن (09...) *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} required dir="ltr" /></div>
            <div>
              <Label>نقش *</Label>
              <select className="w-full border rounded p-2" value={requestedRole} onChange={(e) => setRequestedRole(e.target.value)}>
                <option value="">انتخاب...</option>
                <option value="INSTRUCTOR">مربی</option>
                <option value="INSTRUCTOR_ASSISTANT">مربی یار</option>
                <option value="EVALUATOR">ارزیاب</option>
                <option value="BRANCH_MANAGER">مسئول شعبه</option>
                <option value="BROTHERS_SKILLS_SUPERVISOR">مسئول مهارتی برادران</option>
                <option value="SISTERS_SKILLS_SUPERVISOR">مسئول مهارتی خواهران</option>
                <option value="SUPERVISOR">مسئول</option>
              </select>
            </div>
            <div><Label>شعبه</Label><select className="w-full border rounded p-2" value={branchId} onChange={(e) => setBranchId(e.target.value)}><option value="">انتخاب...</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><Label>مکتب</Label><select className="w-full border rounded p-2" value={maktabId} onChange={(e) => setMaktabId(e.target.value)}><option value="">انتخاب...</option>{maktabs.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "در حال ثبت..." : "ثبت‌نام"}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onBack}>بازگشت</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
