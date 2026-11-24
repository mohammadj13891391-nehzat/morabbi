"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Singleton to hold the install prompt event
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installListeners: ((event: BeforeInstallPromptEvent | null) => void)[] = [];

export function triggerInstallPrompt(): Promise<void> {
  if (deferredPrompt) {
    return deferredPrompt.prompt().then(() => {
      // The prompt can only be used once
      deferredPrompt = null;
      notifyInstallListeners(null);
    });
  }
  return Promise.reject(new Error("نصب در دسترس نیست"));
}

function notifyInstallListeners(event: BeforeInstallPromptEvent | null) {
  installListeners.forEach((cb) => cb(event));
}

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker (works in both dev and production now)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Periodically check for updates (every hour)
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 60 * 1000);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // Capture install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      notifyInstallListeners(deferredPrompt);
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      notifyInstallListeners(null);
      console.log("[PWA] App installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Show update notification
  useEffect(() => {
    if (updateAvailable && "serviceWorker" in navigator) {
      // Auto-activate new version
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage("SKIP_WAITING");
        }
      });
    }
  }, [updateAvailable]);

  return null;
}

// Hook for components to use install prompt
export function useInstallPrompt() {
  // Use a function initializer so we don't call setState synchronously in the effect
  const [canInstall, setCanInstall] = useState<boolean>(() => !!deferredPrompt);

  useEffect(() => {
    const listener = (event: BeforeInstallPromptEvent | null) => {
      setCanInstall(!!event);
    };
    installListeners.push(listener);
    return () => {
      installListeners = installListeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    canInstall,
    promptInstall: triggerInstallPrompt,
  };
}
