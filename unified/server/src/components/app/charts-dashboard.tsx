"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/app-constants";
import { Loader2, TrendingUp, PieChart, BarChart3 } from "lucide-react";

export function ChartsDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/analytics/charts").then(res => setData(res)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!data) return null;

  const maxMonthly = Math.max(...data.monthlyTrend.map((m: any) => m.total), 1);
  const maxMaktab = Math.max(...data.maktabComparison.map((m: any) => m.count), 1);
  const totalStatus = Object.values(data.statusDistribution).reduce((a: number, b: any) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Monthly Trend */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" />روند ماهانه (۶ ماه اخیر)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {data.monthlyTrend.map((m: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-medium">{m.total}</div>
                <div className="w-full flex flex-col gap-px justify-end" style={{ height: "120px" }}>
                  <div className="bg-emerald-500 rounded-t" style={{ height: `${(m.approved / maxMonthly) * 100}%` }} title={`تأیید: ${m.approved}`} />
                  <div className="bg-amber-400" style={{ height: `${(m.pending / maxMonthly) * 100}%` }} title={`در انتظار: ${m.pending}`} />
                </div>
                <div className="text-xs text-muted-foreground truncate w-full text-center">{m.month}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded" />تأییدشده</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded" />در انتظار</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-4 h-4" />توزیع وضعیت گزارش‌ها</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(data.statusDistribution).map(([status, count]: any) => {
              const pct = Math.round((count / totalStatus) * 100);
              const labels: any = { DRAFT: "پیش‌نویس", SUBMITTED: "ارسال‌شده", APPROVED: "تأییدشده", RETURNED: "بازگشت‌شده" };
              const colors: any = { DRAFT: "bg-gray-400", SUBMITTED: "bg-amber-400", APPROVED: "bg-emerald-500", RETURNED: "bg-red-400" };
              return (
                <div key={status} className="text-center">
                  <div className={`w-16 h-16 rounded-full ${colors[status]} flex items-center justify-center text-white font-bold mx-auto`}>{count}</div>
                  <div className="text-xs mt-1">{labels[status] || status}</div>
                  <div className="text-xs text-muted-foreground">{pct}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Maktab Comparison */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" />مقایسه مکتب‌ها</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.maktabComparison.map((m: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{m.name}</span><span className="font-medium">{m.count}</span></div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-emerald-500 to-emerald-600 rounded-full" style={{ width: `${(m.count / maxMaktab) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {data.topPerformers?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">برترین مربیان</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topPerformers.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-600" : "bg-muted-foreground"}`}>{i + 1}</div>
                  <div className="flex-1"><div className="font-medium text-sm">{p.name}</div></div>
                  <div className="text-right"><div className="font-bold text-emerald-600">{p.totalPoints}</div><div className="text-xs text-muted-foreground">امتیاز</div></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
