"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, RECOGNITION_LEVEL_LABELS } from "@/lib/app-constants";
import { toPersianDateTime } from "@/lib/session";
import { Trophy, Award, Plus, Loader2, Crown, Medal } from "lucide-react";
import { toast } from "sonner";

interface RecognitionBoardProps {
  user: any;
}

export function RecognitionBoard({ user }: RecognitionBoardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [level, setLevel] = useState("WEEKLY_BRANCH");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const result = await apiFetch("/api/recognition", {}, user.id);
      setData(result);
      const usersResult = await apiFetch("/api/users?role=INSTRUCTOR", {}, user.id);
      setUsers(usersResult.users);
      if (user.role === "CENTRAL_SUPERVISOR" || user.role === "ADMIN") {
        const branchesResult = await apiFetch("/api/branches", {}, user.id);
        setBranches(branchesResult.branches);
      }
    } catch (err: any) {
      toast.error("خطا در دریافت تقدیرها: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleAward = async () => {
    if (!selectedUserId || !title) {
      toast.error("کاربر و عنوان الزامی است");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/recognition", {
        method: "POST",
        body: JSON.stringify({
          userId: selectedUserId,
          level,
          title,
          description,
          period,
        }),
      }, user.id);
      toast.success("تقدیر با موفقیت اعطا شد");
      setDialogOpen(false);
      // Reset form
      setSelectedUserId("");
      setTitle("");
      setDescription("");
      setPeriod("");
      // Reload
      setLoading(true);
      loadData();
    } catch (err: any) {
      toast.error("خطا در اعطای تقدیر: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canAward = user.role === "BRANCH_MANAGER" || user.role === "CENTRAL_SUPERVISOR" || user.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header with verse */}
      <Card className="bg-gradient-to-l from-amber-100 via-amber-50 to-emerald-50 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-emerald-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="p-6 text-center">
          <Trophy className="w-10 h-10 mx-auto text-amber-500 mb-2" />
          <h2 className="text-xl font-bold">السابقون السابقون</h2>
          <p className="text-sm text-muted-foreground mt-1" dir="rtl">
            ﴿وَالسَّابِقُونَ السَّابِقُونَ * أُولَٰئِكَ الْمُقَرَّبُونَ﴾ — الواقعة: ۱۰-۱۱
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            تقدیر از برترین عملکرد در راستای استباق در خیرات
          </p>
        </CardContent>
      </Card>

      {/* Top performers */}
      {data?.topPerformers && data.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              سابقون — برترین مربیان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPerformers.map((p: any, i: number) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    i === 0 ? "bg-gradient-to-l from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200 dark:border-yellow-900" :
                    i === 1 ? "bg-gradient-to-l from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border border-gray-200 dark:border-gray-800" :
                    i === 2 ? "bg-gradient-to-l from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-900" :
                    "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-600" : "bg-muted-foreground"
                    }`}>
                      {i === 0 ? <Crown className="w-5 h-5" /> : i === 1 ? <Medal className="w-5 h-5" /> : i + 1}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {p.branch && (
                        <div className="text-xs text-muted-foreground">{p.branch.name}</div>
                      )}
                      {p.recognitionsCount > 0 && (
                        <div className="text-xs text-amber-600 mt-0.5">
                          {p.recognitionsCount} تقدیر
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">{p.totalPoints}</div>
                    <div className="text-xs text-muted-foreground">امتیاز</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Award button */}
      {canAward && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="secondary">
              <Plus className="w-4 h-4 ml-1" />
              اعطای تقدیر جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>اعطای تقدیر</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>مربی *</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مربی..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} {u.branch?.name ? `• ${u.branch.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>سطح تقدیر *</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECOGNITION_LEVEL_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>عنوان تقدیر *</Label>
                <Input
                  placeholder="مثلاً: السابق هفتگی — هفته ۳ آبان"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>دوره</Label>
                <Input
                  placeholder="مثلاً: ۱۴۰۴/۰۸ یا هفته ۳ آبان"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>توضیح</Label>
                <Textarea
                  placeholder="دلیل تقدیر..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                ℹ️ با اعطای تقدیر، امتیاز پاداش به مربی اضافه می‌شود:
                <br />
                • سابق هفتگی: ۵۰ امتیاز
                <br />
                • سابق ماهانه شعبه: ۱۵۰ امتیاز
                <br />
                • السابق ماهانه مرکزی: ۳۰۰ امتیاز
                <br />
                • تقدیر ویژه: ۱۰۰ امتیاز
              </div>
              <Button onClick={handleAward} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Award className="w-4 h-4 ml-1" />}
                اعطای تقدیر
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Recent recognitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4" />
            تقدیرهای اخیر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recognitions && data.recognitions.length > 0 ? (
            <div className="space-y-2">
              {data.recognitions.map((r: any) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg border bg-gradient-to-l from-amber-50/50 to-transparent dark:from-amber-950/10"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium">{r.user?.name}</div>
                    <Badge variant="outline" className="text-amber-700 dark:text-amber-300">
                      {RECOGNITION_LEVEL_LABELS[r.level] || r.level}
                    </Badge>
                  </div>
                  <div className="text-sm">{r.title}</div>
                  {r.description && (
                    <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.branch?.name} • {toPersianDateTime(new Date(r.createdAt))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">هنوز تقدیری ثبت نشده است</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
