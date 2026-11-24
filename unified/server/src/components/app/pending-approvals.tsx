"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/app-constants";
import { toPersianDateTime } from "@/lib/session";
import { Loader2, UserCheck, UserX, Clock, Users } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  INSTRUCTOR: "مربی",
  INSTRUCTOR_ASSISTANT: "مربی یار",
  EVALUATOR: "ارزیاب",
  BRANCH_MANAGER: "مسئول شعبه",
  BROTHERS_SKILLS_SUPERVISOR: "مسئول مهارتی برادران",
  SISTERS_SKILLS_SUPERVISOR: "مسئول مهارتی خواهران",
  SUPERVISOR: "مسئول",
  ADMIN: "مدیر سیستم",
};

export function PendingApprovals({ user }: { user: any }) {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({});

  const loadPending = async () => {
    try {
      setLoading(true);
      const result = await apiFetch("/api/auth/pending-approvals");
      setPendingUsers(result.pendingUsers);
    } catch (err: any) {
      toast.error("خطا در دریافت لیست: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setProcessing(userId);
    try {
      const role = roleOverrides[userId] || undefined;
      await apiFetch("/api/auth/approve", {
        method: "POST",
        body: JSON.stringify({ userId, action, role }),
      });
      toast.success(action === "approve" ? "کاربر تأیید شد ✅" : "ثبت‌نام رد شد");
      setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          تأیید نقش کاربران ثبت‌نام‌شده
        </h2>
        {pendingUsers.length > 0 && (
          <Badge variant="secondary">{pendingUsers.length} در انتظار</Badge>
        )}
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>هیچ ثبت‌نام در انتظاری وجود ندارد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      <div>کد ملی: <span dir="ltr">{u.nationalId}</span></div>
                      <div>تلفن: <span dir="ltr">{u.phone}</span></div>
                      <div>نقش درخواستی: <Badge variant="outline">{ROLE_LABELS[u.requestedRole] || u.requestedRole}</Badge></div>
                      {u.branch && <div>شعبه: {u.branch.name}</div>}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {toPersianDateTime(new Date(u.createdAt))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">تأیید با نقش:</label>
                      <Select
                        value={roleOverrides[u.id] || u.requestedRole}
                        onValueChange={(v) => setRoleOverrides({ ...roleOverrides, [u.id]: v })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INSTRUCTOR">مربی</SelectItem>
                          <SelectItem value="INSTRUCTOR_ASSISTANT">مربی یار</SelectItem>
                          <SelectItem value="EVALUATOR">ارزیاب</SelectItem>
                          <SelectItem value="BRANCH_MANAGER">مسئول شعبه</SelectItem>
                          <SelectItem value="BROTHERS_SKILLS_SUPERVISOR">مسئول مهارتی برادران</SelectItem>
                          <SelectItem value="SISTERS_SKILLS_SUPERVISOR">مسئول مهارتی خواهران</SelectItem>
                          <SelectItem value="SUPERVISOR">مسئول</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAction(u.id, "approve")}
                        disabled={processing === u.id}
                      >
                        {processing === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><UserCheck className="w-4 h-4 ml-1" />تأیید</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(u.id, "reject")}
                        disabled={processing === u.id}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
