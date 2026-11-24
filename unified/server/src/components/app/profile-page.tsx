"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/app-constants";
import { toPersianDateTime } from "@/lib/session";
import { Loader2, User, Award, FileText, Calendar } from "lucide-react";
import { ROLE_LABELS } from "@/lib/app-constants";

export function ProfilePage({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/profile`).then(res => setProfile(res)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!profile) return null;

  const p = profile.profile;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <Card className="bg-gradient-to-l from-emerald-50 to-amber-50 dark:from-emerald-950/20 dark:to-amber-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold">
              {p.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{p.name}</h2>
              <Badge variant="outline" className="mt-1">{ROLE_LABELS[p.role] || p.role}</Badge>
              {p.branch && <div className="text-sm text-muted-foreground mt-1">{p.branch.name}</div>}
              {p.maktab && <div className="text-xs text-muted-foreground">{p.maktab.name}</div>}
            </div>
            {p.totalPoints > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{p.totalPoints}</div>
                <div className="text-xs text-muted-foreground">امتیاز</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <FileText className="w-6 h-6 mx-auto mb-1 text-blue-600" />
          <div className="text-2xl font-bold">{p._count?.reportsAuthored || 0}</div>
          <div className="text-xs text-muted-foreground">گزارش</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Calendar className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
          <div className="text-2xl font-bold">{p._count?.lessonPlansAuthored || 0}</div>
          <div className="text-xs text-muted-foreground">طرح درس</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Award className="w-6 h-6 mx-auto mb-1 text-amber-600" />
          <div className="text-2xl font-bold">{p.recognitionsCount}</div>
          <div className="text-xs text-muted-foreground">تقدیر</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <User className="w-6 h-6 mx-auto mb-1 text-purple-600" />
          <div className="text-2xl font-bold">{p._count?.comments || 0}</div>
          <div className="text-xs text-muted-foreground">پیام</div>
        </CardContent></Card>
      </div>

      {/* Recent Reports */}
      {profile.recentReports?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">گزارش‌های اخیر</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {profile.recentReports.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded border">
                <span>{r.subject}</span>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Recognitions */}
      {profile.recentRecognitions?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">تقدیرهای اخیر</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {profile.recentRecognitions.map((r: any) => (
              <div key={r.id} className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 text-sm">
                🏆 {r.title} <span className="text-xs text-muted-foreground">— {toPersianDateTime(new Date(r.createdAt))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          {p.nationalId && <div className="flex justify-between"><span className="text-muted-foreground">کد ملی:</span><span dir="ltr">{p.nationalId}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">تلفن:</span><span dir="ltr">{p.phone}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">عضویت از:</span><span>{toPersianDateTime(new Date(p.createdAt))}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
