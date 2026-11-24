"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch, View } from "@/lib/app-constants";
import { toPersianDateTime } from "@/lib/session";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/notifications-shared";
import { Bell, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NotificationCenterProps {
  user: any;
  onNavigate: (view: View, payload?: any) => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  payload?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter({ user, onNavigate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const result = await apiFetch("/api/notifications?limit=20");
        if (cancelled) return;
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      } catch (err) {
        // Silent fail - notifications are non-critical
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id }),
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err: any) {
      toast.error("خطا در به‌روزرسانی اعلان");
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await apiFetch("/api/notifications/read-all", { method: "POST" });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("همه اعلان‌ها خوانده شدند");
    } catch (err: any) {
      toast.error("خطا در علامت‌گذاری همه");
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      const deleted = notifications.find(n => n.id === id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err: any) {
      toast.error("خطا در حذف اعلان");
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    // Mark as read
    if (!notif.read) {
      markAsRead(notif.id);
    }

    // Navigate based on type
    try {
      const payload = notif.payload ? JSON.parse(notif.payload) : {};
      if (notif.type === "new_report" || notif.type === "evaluation_done" || notif.type === "comment_added") {
        if (payload.targetType === "lesson_plan") {
          onNavigate("lesson_plans_list");
        } else {
          onNavigate("reports_list");
        }
      } else if (notif.type === "recognition_awarded") {
        onNavigate("recognition");
      } else if (notif.type === "new_lesson_plan") {
        onNavigate("lesson_plans_list");
      }
    } catch {
      // ignore
    }

    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
        title="اعلان‌ها"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? "۹+" : unreadCount.toLocaleString("fa-IR")}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-background border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="font-medium text-sm">
              اعلان‌ها
              {unreadCount > 0 && (
                <Badge variant="secondary" className="mr-2 text-xs">
                  {unreadCount.toLocaleString("fa-IR")} جدید
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs h-7"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="w-3 h-3 ml-1" />
                    همه خوانده شد
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Notifications list */}
          <ScrollArea className="max-h-96">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">اعلانی موجود نیست</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                      !notif.read ? "bg-emerald-50/50 dark:bg-emerald-950/10" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {NOTIFICATION_TYPE_LABELS[notif.type as keyof typeof NOTIFICATION_TYPE_LABELS] || notif.type}
                          </span>
                        </div>
                        <div className="text-sm font-medium leading-tight">{notif.title}</div>
                        {notif.body && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.body}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {toPersianDateTime(new Date(notif.createdAt))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                        onClick={(e) => deleteNotification(notif.id, e)}
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t text-center">
              <p className="text-[10px] text-muted-foreground">
                اعلان‌ها هر ۳۰ ثانیه به‌روز می‌شوند
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
