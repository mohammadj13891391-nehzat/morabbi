"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/app-constants";
import { TrendingUp, TrendingDown, Award, AlertCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export function AnalyticsDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"self" | "branch" | "all" | "maktab">("self");
  const [maktabs, setMaktabs] = useState<any[]>([]);
  const [selectedMaktab, setSelectedMaktab] = useState<string>("");

  useEffect(() => {
    apiFetch("/api/maktabs").then(res => setMaktabs(res.maktabs || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (scope !== "maktab" || selectedMaktab) {
      loadAnalytics();
    }
  }, [scope, selectedMaktab]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const maktabParam = scope === "maktab" && selectedMaktab ? `&maktabId=${selectedMaktab}` : "";
      const result = await apiFetch(`/api/analytics?scope=${scope}${maktabParam}`);
      setData(result);
    } catch (err: any) {
      toast.error("خطا در بارگذاری تحلیل");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.totalEvaluations === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{data?.message || "هنوز ارزیابی‌ای انجام نشده است"}</p>
      </div>
    );
  }

  const canSeeBranch = user.role === "BRANCH_MANAGER" || user.role === "CENTRAL_SUPERVISOR" || user.role === "ADMIN";
  const canSeeAll = user.role === "CENTRAL_SUPERVISOR" || user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">تحلیل عملکرد</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <Button size="sm" variant={scope === "self" ? "default" : "outline"} onClick={() => setScope("self")}>
            من
          </Button>
          {canSeeBranch && (
            <Button size="sm" variant={scope === "branch" ? "default" : "outline"} onClick={() => setScope("branch")}>
              شعبه
            </Button>
          )}
          {canSeeAll && (
            <>
              <Button size="sm" variant={scope === "maktab" ? "default" : "outline"} onClick={() => { setScope("maktab"); }}>
                مکتب
              </Button>
              {scope === "maktab" && (
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={selectedMaktab}
                  onChange={(e) => setSelectedMaktab(e.target.value)}
                >
                  <option value="">انتخاب مکتب...</option>
                  {maktabs.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
              <Button size="sm" variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>
                همه
              </Button>
            </>
          )}
        </div>
      </div>

      {/* خلاصه */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">{data.overallAverage.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-1">میانگین کلی</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{data.totalEvaluations}</div>
            <div className="text-xs text-muted-foreground mt-1">تعداد ارزیابی</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{data.totalCriteria}</div>
            <div className="text-xs text-muted-foreground mt-1">معیارهای فعال</div>
          </CardContent>
        </Card>
      </div>

      {/* نقاط قوت */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            نقاط قوت (برترین معیارها)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.strengths.map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">{s.title}</span>
              </div>
              <Badge variant="outline" className="text-emerald-700">{s.average.toFixed(1)}/۱۰</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* نقاط ضعف */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            نقاط قابل بهبود (ضعیف‌ترین معیارها)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.weaknesses.map((w: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm">{w.title}</span>
              </div>
              <Badge variant="outline" className="text-orange-700">{w.average.toFixed(1)}/۱۰</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* جدول کامل */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تحلیل تمام معیارها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.criteriaAnalysis.map((c: any, i: number) => {
              const percentage = (c.average / 10) * 100;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{c.title}</span>
                    <span className="font-medium">{c.average.toFixed(1)} <span className="text-xs text-muted-foreground">({c.count} ارزیابی)</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percentage >= 80 ? "bg-emerald-500" :
                        percentage >= 60 ? "bg-amber-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
