"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { checkServerAvailability, getLastSyncTime } from "@/lib/sync";
import { getPendingReportsCount } from "@/lib/offline-db";

interface SyncIndicatorProps {
  onClick: () => void;
}

export function SyncIndicator({ onClick }: SyncIndicatorProps) {
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const [available, count] = await Promise.all([
        checkServerAvailability(),
        getPendingReportsCount(),
      ]);
      if (!mounted) return;
      setServerAvailable(available);
      setPendingCount(count);
    };

    check();

    // Check every 30 seconds
    const interval = setInterval(check, 30000);

    // Also listen for online/offline events
    const handleOnline = () => check();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOnline);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOnline);
    };
  }, []);

  if (serverAvailable === null) {
    // Checking
    return (
      <Button variant="ghost" size="sm" className="text-xs gap-1 hidden sm:flex" disabled>
        <RefreshCw className="w-3 h-3 animate-spin" />
        ...
      </Button>
    );
  }

  if (!serverAvailable) {
    // Server offline - show pending count if any
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs gap-1 hidden sm:flex text-orange-700 dark:text-orange-300"
        onClick={onClick}
        title="سرور در دسترس نیست — برای مشاهده وضعیت کلیک کنید"
      >
        <WifiOff className="w-3 h-3" />
        {pendingCount > 0 ? `${pendingCount} در انتظار` : "آفلاین"}
      </Button>
    );
  }

  // Server online
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs gap-1 hidden sm:flex text-emerald-700 dark:text-emerald-300"
      onClick={onClick}
      title="سرور در دسترس است — برای مشاهده وضعیت کلیک کنید"
    >
      <Wifi className="w-3 h-3" />
      آنلاین
    </Button>
  );
}
