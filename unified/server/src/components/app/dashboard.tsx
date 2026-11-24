"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, ROLE_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, RECOGNITION_LEVEL_LABELS } from "@/lib/app-constants";
import { toPersianDateTime } from "@/lib/session";
import { FileText, Trophy, Clock, CheckCircle, TrendingUp, Award } from "lucide-react";

interface DashboardProps {
  user: any;
  onNavigate: (view: any) => void;
}

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user.id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await apiFetch("/api/dashboard", {}, user.id);
      setData(result);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">در حال بارگذاری داشبورد...</div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">خطا در بارگذاری داشبورد</div>;
  }

  const { stats, recentReports, branchStats, topPerformers, recentRecognitions } = data;
  const isInstructor = user.role === "INSTRUCTOR";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-700 text-white p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold">سلام، {user.name}</h2>
            <p className="text-emerald-100 text-sm mt-1">
              {ROLE_LABELS[user.role]}
              {user.branch && ` • ${user.branch.name}`}
            </p>
          </div>
          {isInstructor && (
            <div className="text-right">
              <div className="text-3xl font-bold">{user.totalPoints}</div>
              <div className="text-emerald-100 text-xs">امتیاز شما</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalReports}</div>
                <div className="text-xs text-muted-foreground">کل گزارش‌ها</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pendingReports}</div>
                <div className="text-xs text-muted-foreground">در انتظار بررسی</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.approvedReports}</div>
                <div className="text-xs text-muted-foreground">تأیید شده</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.userRecognitions || 0}</div>
                <div className="text-xs text-muted-foreground">تقدیرهای شما</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* السابقون السابقون */}
      <Card className="border-emerald-200 dark:border-emerald-900">
        <CardHeader className="bg-emerald-50 dark:bg-emerald-950/30 rounded-t-xl">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            السابقون السابقون — برترین عملکردها
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {topPerformers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">هنوز داده‌ای موجود نیست</p>
          ) : (
            <div className="space-y-2">
              {topPerformers.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-600" : "bg-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {p.branch && <div className="text-xs text-muted-foreground">{p.branch.name}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{p.totalPoints}</div>
                    <div className="text-xs text-muted-foreground">امتیاز</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => onNavigate("recognition")}>
            مشاهده همه تقدیرها →
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">گزارش‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">هنوز گزارشی ثبت نشده است</p>
              {isInstructor && (
                <Button size="sm" className="mt-3" onClick={() => onNavigate("new_report")}>
                  ثبت اولین گزارش
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.subject}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {!isInstructor && r.instructor?.name && `${r.instructor.name} • `}
                      {toPersianDateTime(new Date(r.createdAt))}
                    </div>
                  </div>
                  <Badge className={REPORT_STATUS_COLORS[r.status] || ""} variant="secondary">
                    {REPORT_STATUS_LABELS[r.status] || r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => onNavigate("reports_list")}>
            مشاهده همه گزارش‌ها →
          </Button>
        </CardContent>
      </Card>

      {/* Branch comparison (for central supervisor) */}
      {branchStats && branchStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              مقایسه شعب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {branchStats.map((b: any) => {
                const maxPoints = Math.max(...branchStats.map((x: any) => x.totalPoints), 1);
                const percentage = (b.totalPoints / maxPoints) * 100;
                return (
                  <div key={b.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-muted-foreground">
                        {b.totalReports} گزارش • {b.totalInstructors} مربی • {b.totalPoints} امتیاز
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-emerald-500 to-emerald-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent recognitions */}
      {recentRecognitions && recentRecognitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              تقدیرهای اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRecognitions.map((r: any) => (
                <div key={r.id} className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/10">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.user.name}</div>
                    <Badge variant="outline" className="text-amber-700 dark:text-amber-300">
                      {RECOGNITION_LEVEL_LABELS[r.level] || r.level}
                    </Badge>
                  </div>
                  <div className="text-sm mt-1">{r.title}</div>
                  {r.description && <div className="text-xs text-muted-foreground mt-1">{r.description}</div>}
                  <div className="text-xs text-muted-foreground mt-1">{toPersianDateTime(new Date(r.createdAt))}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
