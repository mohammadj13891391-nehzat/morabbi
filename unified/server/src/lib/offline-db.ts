// IndexedDB wrapper for offline-first storage
// Stores reports, lesson plans, and sync queue locally in the browser

const DB_NAME = "morabbi-offline-db";
const DB_VERSION = 1;

// Store names
const STORES = {
  REPORTS: "reports",          // Cached reports from server
  LESSON_PLANS: "lesson_plans", // Cached lesson plans from server
  PENDING_REPORTS: "pending_reports",     // Reports created offline, awaiting sync
  PENDING_LESSON_PLANS: "pending_lesson_plans", // Lesson plans created offline
  SYNC_QUEUE: "sync_queue",    // Generic sync queue
  META: "meta",                // Metadata (last sync time, etc.)
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB not available on server"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains(STORES.REPORTS)) {
        const store = db.createObjectStore(STORES.REPORTS, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.LESSON_PLANS)) {
        const store = db.createObjectStore(STORES.LESSON_PLANS, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.PENDING_REPORTS)) {
        const store = db.createObjectStore(STORES.PENDING_REPORTS, { keyPath: "localId" });
        store.createIndex("status", "status", { unique: false }); // pending | synced | failed
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.PENDING_LESSON_PLANS)) {
        const store = db.createObjectStore(STORES.PENDING_LESSON_PLANS, { keyPath: "localId" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: "id", autoIncrement: true });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: "key" });
      }
    };
  });

  return dbPromise;
}

// Generic helper to perform a transaction
async function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ Pending Reports (created offline) ============

export interface PendingReport {
  localId: string;          // UUID generated locally
  data: any;                // The report data
  status: "pending" | "synced" | "failed";
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export async function savePendingReport(data: any): Promise<string> {
  const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  const pending: PendingReport = {
    localId,
    data,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await tx(STORES.PENDING_REPORTS, "readwrite", (s) => s.add(pending));
  return localId;
}

export async function updatePendingReport(localId: string, updates: Partial<PendingReport>): Promise<void> {
  const existing = await tx<PendingReport>(STORES.PENDING_REPORTS, "readonly", (s) => s.get(localId) as IDBRequest<PendingReport>);
  if (!existing) return;
  await tx(STORES.PENDING_REPORTS, "readwrite", (s) => s.put({ ...existing, ...updates, updatedAt: new Date().toISOString() }));
}

export async function deletePendingReport(localId: string): Promise<void> {
  await tx(STORES.PENDING_REPORTS, "readwrite", (s) => s.delete(localId));
}

export async function getPendingReports(): Promise<PendingReport[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PENDING_REPORTS, "readonly");
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as PendingReport[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingReportsCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PENDING_REPORTS, "readonly");
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const index = store.index("status");
    const request = index.count("pending");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ Pending Lesson Plans ============

export interface PendingLessonPlan {
  localId: string;
  data: any;
  status: "pending" | "synced" | "failed";
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export async function savePendingLessonPlan(data: any): Promise<string> {
  const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  const pending: PendingLessonPlan = {
    localId,
    data,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await tx(STORES.PENDING_LESSON_PLANS, "readwrite", (s) => s.add(pending));
  return localId;
}

export async function updatePendingLessonPlan(localId: string, updates: Partial<PendingLessonPlan>): Promise<void> {
  const existing = await tx<PendingLessonPlan>(STORES.PENDING_LESSON_PLANS, "readonly", (s) => s.get(localId) as IDBRequest<PendingLessonPlan>);
  if (!existing) return;
  await tx(STORES.PENDING_LESSON_PLANS, "readwrite", (s) => s.put({ ...existing, ...updates, updatedAt: new Date().toISOString() }));
}

export async function deletePendingLessonPlan(localId: string): Promise<void> {
  await tx(STORES.PENDING_LESSON_PLANS, "readwrite", (s) => s.delete(localId));
}

export async function getPendingLessonPlans(): Promise<PendingLessonPlan[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PENDING_LESSON_PLANS, "readonly");
    const store = transaction.objectStore(STORES.PENDING_LESSON_PLANS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as PendingLessonPlan[]);
    request.onerror = () => reject(request.error);
  });
}

// ============ Meta (key-value) ============

export async function getMeta(key: string): Promise<any> {
  const result = await tx<{ key: string; value: any }>(STORES.META, "readonly", (s) => s.get(key) as IDBRequest<any>);
  return result?.value;
}

export async function setMeta(key: string, value: any): Promise<void> {
  await tx(STORES.META, "readwrite", (s) => s.put({ key, value }));
}

// ============ Cached data from server ============

export async function cacheReports(reports: any[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.REPORTS, "readwrite");
    const store = transaction.objectStore(STORES.REPORTS);
    // Clear existing
    store.clear();
    // Add all
    for (const r of reports) {
      store.put(r);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCachedReports(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.REPORTS, "readonly");
    const store = transaction.objectStore(STORES.REPORTS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheLessonPlans(plans: any[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.LESSON_PLANS, "readwrite");
    const store = transaction.objectStore(STORES.LESSON_PLANS);
    store.clear();
    for (const p of plans) {
      store.put(p);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCachedLessonPlans(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.LESSON_PLANS, "readonly");
    const store = transaction.objectStore(STORES.LESSON_PLANS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// ============ Statistics ============

export async function getOfflineStats() {
  const pendingReports = await getPendingReports();
  const pendingLessonPlans = await getPendingLessonPlans();
  const cachedReports = await getCachedReports();
  const cachedLessonPlans = await getCachedLessonPlans();
  const lastSync = await getMeta("lastSyncAt");

  return {
    pendingReports: pendingReports.filter(p => p.status === "pending").length,
    failedReports: pendingReports.filter(p => p.status === "failed").length,
    pendingLessonPlans: pendingLessonPlans.filter(p => p.status === "pending").length,
    failedLessonPlans: pendingLessonPlans.filter(p => p.status === "failed").length,
    cachedReports: cachedReports.length,
    cachedLessonPlans: cachedLessonPlans.length,
    lastSyncAt: lastSync,
  };
}

// ============ Export/Import (for manual backup) ============

export async function exportAllData() {
  const pendingReports = await getPendingReports();
  const pendingLessonPlans = await getPendingLessonPlans();
  const cachedReports = await getCachedReports();
  const cachedLessonPlans = await getCachedLessonPlans();

  return {
    version: "v3-offline",
    exportedAt: new Date().toISOString(),
    pendingReports,
    pendingLessonPlans,
    cachedReports,
    cachedLessonPlans,
  };
}

export async function clearAllLocalData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.REPORTS, STORES.LESSON_PLANS, STORES.PENDING_REPORTS, STORES.PENDING_LESSON_PLANS, STORES.SYNC_QUEUE, STORES.META],
      "readwrite"
    );
    for (const storeName of [STORES.REPORTS, STORES.LESSON_PLANS, STORES.PENDING_REPORTS, STORES.PENDING_LESSON_PLANS, STORES.SYNC_QUEUE, STORES.META]) {
      transaction.objectStore(storeName).clear();
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
