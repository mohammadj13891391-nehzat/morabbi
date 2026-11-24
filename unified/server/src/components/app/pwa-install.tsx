"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInstallPrompt } from "@/components/app/sw-register";
import { apiFetch } from "@/lib/app-constants";
import { Download, Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PWAInstallButton({ variant = "outline", size = "sm" }: PWAInstallButtonProps) {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);

  if (!canInstall) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await promptInstall();
      toast.success("سامانه نصب شد 🎉");
    } catch (err: any) {
      // User dismissed or it failed
      if (!err.message?.includes("نصب در دسترس نیست")) {
        toast.info("نصب لغو شد");
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleInstall} disabled={installing}>
      {installing ? (
        <><Loader2 className="w-3 h-3 ml-1 animate-spin" />در حال نصب...</>
      ) : (
        <><Download className="w-3 h-3 ml-1" />نصب سامانه</>
      )}
    </Button>
  );
}

// Connection status indicator
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Check server availability
    const checkServer = async () => {
      try {
        await apiFetch("/api/health");
        setServerAvailable(true);
      } catch {
        setServerAvailable(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  if (!isOnline) {
    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-300">
        <WifiOff className="w-3 h-3 ml-1" />
        آفلاین
      </Badge>
    );
  }

  if (serverAvailable === false) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300">
        <WifiOff className="w-3 h-3 ml-1" />
        سرور در دسترس نیست
      </Badge>
    );
  }

  if (serverAvailable === true) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 hidden sm:flex">
        <Wifi className="w-3 h-3 ml-1" />
        آنلاین
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-muted/50 hidden sm:flex">
      <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
      ...
    </Badge>
  );
}
