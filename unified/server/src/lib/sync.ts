// Sync service - tries to push pending local data to the central server
// Also pulls updates from server when available

import {
  getPendingReports,
  getPendingLessonPlans,
  updatePendingReport,
  updatePendingLessonPlan,
  deletePendingReport,
  deletePendingLessonPlan,
  setMeta,
  getMeta,
  cacheReports,
  cacheLessonPlans,
} from "./offline-db";

const SYNC_API_BASE = "/api/sync";
const MAX_ATTEMPTS = 5;
const SYNC_INTERVAL_MS = 60 * 1000; // Try every minute when online

let syncInProgress = false;
let lastSyncResult: SyncResult | null = null;

export interface SyncResult {
  success: boolean;
  timestamp: string;
  pushedReports: number;
  pushedLessonPlans: number;
  failedReports: number;
  failedLessonPlans: number;
  pulledReports: number;
  pulledLessonPlans: number;
  errors: string[];
  serverAvailable: boolean;
}

// Check if we can reach the server
export async function checkServerAvailability(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Push a single pending report to the server
async function pushReport(pending: any): Promise<{ success: boolean; error?: string; serverId?: string }> {
  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pending.data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      return { success: false, error: error.error };
    }

    const result = await response.json();
    return { success: true, serverId: result.report?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Push a single pending lesson plan
async function pushLessonPlan(pending: any): Promise<{ success: boolean; error?: string; serverId?: string }> {
  try {
    const response = await fetch("/api/lesson-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pending.data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      return { success: false, error: error.error };
    }

    const result = await response.json();
    return { success: true, serverId: result.lessonPlan?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Pull latest data from server
async function pullFromServer(): Promise<{ reports: number; lessonPlans: number }> {
  let reportsCount = 0;
  let lessonPlansCount = 0;

  try {
    // Get auth token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("morabbi_session_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers["x-user-id"] = token;

    const [reportsRes, lessonPlansRes] = await Promise.all([
      fetch("/api/reports", { headers }),
      fetch("/api/lesson-plans", { headers }),
    ]);

    if (reportsRes.ok) {
      const reportsData = await reportsRes.json();
      if (reportsData.reports) {
        await cacheReports(reportsData.reports);
        reportsCount = reportsData.reports.length;
      }
    }

    if (lessonPlansRes.ok) {
      const lessonPlansData = await lessonPlansRes.json();
      if (lessonPlansData.lessonPlans) {
        await cacheLessonPlans(lessonPlansData.lessonPlans);
        lessonPlansCount = lessonPlansData.lessonPlans.length;
      }
    }
  } catch (err) {
    // Server unavailable - that's OK, we'll retry later
    console.log("Pull from server failed:", err);
  }

  return { reports: reportsCount, lessonPlans: lessonPlansCount };
}

// Main sync function - tries to push pending data and pull updates
export async function syncNow(): Promise<SyncResult> {
  if (syncInProgress) {
    return lastSyncResult || {
      success: false,
      timestamp: new Date().toISOString(),
      pushedReports: 0,
      pushedLessonPlans: 0,
      failedReports: 0,
      failedLessonPlans: 0,
      pulledReports: 0,
      pulledLessonPlans: 0,
      errors: ["Sync already in progress"],
      serverAvailable: false,
    };
  }

  syncInProgress = true;
  const errors: string[] = [];
  let pushedReports = 0;
  let pushedLessonPlans = 0;
  let failedReports = 0;
  let failedLessonPlans = 0;

  const serverAvailable = await checkServerAvailability();

  if (!serverAvailable) {
    syncInProgress = false;
    lastSyncResult = {
      success: false,
      timestamp: new Date().toISOString(),
      pushedReports: 0,
      pushedLessonPlans: 0,
      failedReports: 0,
      failedLessonPlans: 0,
      pulledReports: 0,
      pulledLessonPlans: 0,
      errors: ["سرور مسئول در دسترس نیست"],
      serverAvailable: false,
    };
    return lastSyncResult;
  }

  // Push pending reports
  const pendingReports = await getPendingReports();
  for (const pending of pendingReports) {
    if (pending.status === "synced") continue;
    if (pending.attempts >= MAX_ATTEMPTS) {
      failedReports++;
      continue;
    }

    const result = await pushReport(pending);
    if (result.success) {
      await updatePendingReport(pending.localId, {
        status: "synced",
        attempts: pending.attempts + 1,
      });
      // Optionally delete synced items after a delay
      // For now, keep them marked as synced for audit
      pushedReports++;
    } else {
      await updatePendingReport(pending.localId, {
        status: "failed",
        attempts: pending.attempts + 1,
        lastError: result.error,
      });
      failedReports++;
      errors.push(`گزارش ${pending.localId}: ${result.error}`);
    }
  }

  // Push pending lesson plans
  const pendingLessonPlans = await getPendingLessonPlans();
  for (const pending of pendingLessonPlans) {
    if (pending.status === "synced") continue;
    if (pending.attempts >= MAX_ATTEMPTS) {
      failedLessonPlans++;
      continue;
    }

    const result = await pushLessonPlan(pending);
    if (result.success) {
      await updatePendingLessonPlan(pending.localId, {
        status: "synced",
        attempts: pending.attempts + 1,
      });
      pushedLessonPlans++;
    } else {
      await updatePendingLessonPlan(pending.localId, {
        status: "failed",
        attempts: pending.attempts + 1,
        lastError: result.error,
      });
      failedLessonPlans++;
      errors.push(`طرح درس ${pending.localId}: ${result.error}`);
    }
  }

  // Pull updates from server
  const pulled = await pullFromServer();

  // Update last sync time
  const now = new Date().toISOString();
  await setMeta("lastSyncAt", now);

  syncInProgress = false;
  lastSyncResult = {
    success: errors.length === 0,
    timestamp: now,
    pushedReports,
    pushedLessonPlans,
    failedReports,
    failedLessonPlans,
    pulledReports: pulled.reports,
    pulledLessonPlans: pulled.lessonPlans,
    errors,
    serverAvailable: true,
  };

  return lastSyncResult;
}

// Auto-sync loop - tries to sync periodically
let autoSyncInterval: any = null;

export function startAutoSync() {
  if (autoSyncInterval) return;
  // Try sync every SYNC_INTERVAL_MS
  autoSyncInterval = setInterval(async () => {
    // Only sync if browser is online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const result = await syncNow();
        console.log(`[Sync] ${result.success ? "✓" : "✗"} - ${result.timestamp}`, result);
      } catch (err) {
        console.error("[Sync] Auto-sync failed:", err);
      }
    }
  }, SYNC_INTERVAL_MS);

  // Also try sync immediately when browser comes online
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      console.log("[Sync] Browser came online, syncing...");
      syncNow().catch(console.error);
    });
  }
}

export function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

export function getLastSyncResult(): SyncResult | null {
  return lastSyncResult;
}

// Get last sync time from IndexedDB
export async function getLastSyncTime(): Promise<string | null> {
  return await getMeta("lastSyncAt");
}
