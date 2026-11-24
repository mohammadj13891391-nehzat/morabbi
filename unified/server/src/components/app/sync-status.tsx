"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getOfflineStats,
  exportAllData,
  clearAllLocalData,
} from "@/lib/offline-db";
import {
  syncNow,
  checkServerAvailability,
  startAutoSync,
  getLastSyncTime,
  type SyncResult,
} from "@/lib/sync";
import {
  RefreshCw,
  CloudOff,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Clock,
  WifiOff,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

interface SyncStatusProps {
  user: any;
}

export function SyncStatus({ user }: SyncStatusProps) {
  const [stats, setStats] = useState<any>(null);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const refreshStats = async () => {
    try {
      const s = await getOfflineStats();
      setStats(s);
      const last = await getLastSyncTime();
      setLastSync(last);
    } catch (err) {
      console.error("Failed to get stats:", err);
    }
  };

  const checkServer = async () => {
    const available = await checkServerAvailability();
    setServerAvailable(available);
    return available;
  };

  useEffect(() => {
    refreshStats();
    checkServer();
    startAutoSync();

    // Refresh stats every 10 seconds
    const interval = setInterval(refreshStats, 10000);

    // Check server every 30 seconds
    const serverInterval = setInterval(checkServer, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(serverInterval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncNow();
      setLastResult(result);
      await refreshStats();
      await checkServer();

      if (result.success) {
        toast.success(
          `همگام‌سازی موفق: ${result.pushedReports} گزارش، ${result.pushedLessonPlans} طرح درس ارسال شد`
        );
      } else if (result.serverAvailable) {
        toast.warning(
          `همگام‌سازی با خطا: ${result.pushedReports} ارسال شد، ${result.failedReports} ناموفق`
        );
      } else {
        toast.info("سرور مسئول در دسترس نیست — داده‌ها محلی نگه‌داری می‌شود");
      }
    } catch (err: any) {
      toast.error("خطا در همگام‌سازی: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `morabbi-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("فایل پشتیبان دانلود شد");
    } catch (err: any) {
      toast.error("خطا در خروجی: " + err.message);
    }
  };

  const handleClearLocal = async () => {
    if (!confirm("آیا مطمئن هستید؟ همه داده‌های محلی پاک می‌شود (داده‌های روی سرور باقی می‌ماند).")) {
      return;
    }
    try {
      await clearAllLocalData();
      await refreshStats();
      toast.success("داده‌های محلی پاک شد");
    } catch (err: any) {
      toast.error("خطا در پاک‌سازی: " + err.message);
    }
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "هرگز";
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasPending = stats.pendingReports > 0 || stats.pendingLessonPlans > 0;
  const hasFailed = stats.failedReports > 0 || stats.failedLessonPlans > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold">وضعیت همگام‌سازی</h2>
        <p className="text-sm text-muted-foreground mt-1">
          مدیریت داده‌های محلی و همگام‌سازی با سرور مسئول
        </p>
      </div>

      {/* Server Status */}
      <Card className={serverAvailable === false ? "border-orange-300" : "border-emerald-300"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {serverAvailable === null ? (
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : serverAvailable ? (
                <Wifi className="w-5 h-5 text-emerald-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-orange-600" />
              )}
              <div>
                <div className="font-medium">
                  {serverAvailable === null ? "در حال بررسی..." :
                   serverAvailable ? "سرور مسئول در دسترس است" :
                   "سرور مسئول در دسترس نیست"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {serverAvailable ? "همگام‌سازی خودکار فعال است" : "داده‌ها محلی نگه‌داری می‌شود و وقتی سرور در دسترس شد، ارسال می‌گردد"}
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={checkServer}>
              بررسی مجدد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Sync */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium">آخرین همگام‌سازی</div>
              <div className="text-sm text-muted-foreground">{formatDateTime(lastSync)}</div>
            </div>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <><RefreshCw className="w-4 h-4 ml-2 animate-spin" />در حال همگام‌سازی...</>
              ) : (
                <><RefreshCw className="w-4 h-4 ml-2" />همگام‌سازی دستی</>
              )}
            </Button>
          </div>

          {lastResult && (
            <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm">
              {lastResult.success ? (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>همگام‌سازی موفق</span>
                </div>
              ) : lastResult.serverAvailable ? (
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>همگام‌سازی با خطا — برخی موارد ناموفق بود</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <CloudOff className="w-4 h-4" />
                  <span>سرور در دسترس نبود</span>
                </div>
              )}

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>گزارش ارسال‌شده: {lastResult.pushedReports}</div>
                <div>طرح درس ارسال‌شده: {lastResult.pushedLessonPlans}</div>
                <div>گزارش ناموفق: {lastResult.failedReports}</div>
                <div>طرح درس ناموفق: {lastResult.failedLessonPlans}</div>
                <div>گزارش دریافت‌شده: {lastResult.pulledReports}</div>
                <div>طرح درس دریافت‌شده: {lastResult.pulledLessonPlans}</div>
              </div>

              {lastResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer text-muted-foreground">
                    مشاهده خطاها ({lastResult.errors.length})
                  </summary>
                  <ul className="mt-1 text-xs space-y-0.5 list-disc list-inside">
                    {lastResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local Data Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            داده‌های محلی (روی این دستگاه)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-2">
                <CloudOff className="w-4 h-4 text-amber-600" />
                <div className="text-xs text-muted-foreground">گزارش در انتظار ارسال</div>
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{stats.pendingReports}</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-2">
                <CloudOff className="w-4 h-4 text-amber-600" />
                <div className="text-xs text-muted-foreground">طرح درس در انتظار</div>
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{stats.pendingLessonPlans}</div>
            </div>
            {hasFailed && (
              <>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <div className="text-xs text-muted-foreground">گزارش ناموفق</div>
                  </div>
                  <div className="text-2xl font-bold text-red-700 mt-1">{stats.failedReports}</div>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <div className="text-xs text-muted-foreground">طرح درس ناموفق</div>
                  </div>
                  <div className="text-2xl font-bold text-red-700 mt-1">{stats.failedLessonPlans}</div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div className="text-xs text-muted-foreground">گزارش ذخیره‌شده از سرور</div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.cachedReports}</div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div className="text-xs text-muted-foreground">طرح درس ذخیره‌شده</div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.cachedLessonPlans}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">عملیات دستی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 ml-2" />
            دانلود فایل پشتیبان (JSON)
            <span className="text-xs text-muted-foreground mr-auto">برای انتقال دستی به سرور مسئول</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-red-700 dark:text-red-300 hover:text-red-800"
            onClick={handleClearLocal}
          >
            <Trash2 className="w-4 h-4 ml-2" />
            پاک‌سازی داده‌های محلی
            <span className="text-xs text-muted-foreground mr-auto">داده‌های سرور تأثیر نمی‌پذیرد</span>
          </Button>
        </CardContent>
      </Card>

      {/* Help text */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4 text-sm space-y-2">
          <div className="font-medium text-blue-700 dark:text-blue-300">💡 راهنمای حالت آفلاین</div>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside text-xs">
            <li>وقتی سرور مسئول در دسترس نیست، گزارش‌ها و طرح‌درس‌ها به‌صورت محلی ذخیره می‌شوند</li>
            <li>وقتی سرور در دسترس شود (مثلاً مسئول سیستم را روشن کند)، داده‌ها به‌صورت خودکار ارسال می‌شوند</li>
            <li>همگام‌سازی خودکار هر ۶۰ ثانیه یک‌بار انجام می‌شود (اگر سرور در دسترس باشد)</li>
            <li>وقتی مرورگر دوباره آنلاین شود، همگام‌سازی فوراً آغاز می‌گردد</li>
            <li>برای انتقال دستی، از «دانلود فایل پشتیبان» استفاده کنید و فایل را به مسئول بدهید</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
