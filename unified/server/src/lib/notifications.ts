// Helper for creating and managing notifications - SERVER SIDE ONLY
// This file uses dynamic imports to avoid bundling web-push on the client

import { db } from "./db";
import type { NotificationType } from "./notifications-shared";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  payload?: Record<string, any>;
  sendPush?: boolean;
}

// Create a notification for a user (in-app + push)
// IMPORTANT: This function should only be called from server-side code (API routes)
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const sendPush = input.sendPush !== false;

  try {
    // 1. Save in-app notification
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body || null,
        payload: input.payload ? JSON.stringify(input.payload) : null,
      },
    });

    // 2. Send push notification (best-effort)
    // Use a runtime check to avoid loading web-push in non-server environments
    if (sendPush && typeof globalThis !== "undefined") {
      try {
        // Dynamic import - will only execute on server
        const pushModule = await import("./push");
        // Fire and forget
        pushModule.sendPushToUser(input.userId, {
          title: input.title,
          body: input.body,
          data: input.payload,
          tag: input.type,
        }).catch(() => {
          // Silent fail - push is best-effort
        });
      } catch {
        // Push module not available - that's OK
      }
    }
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

// Notify all branch managers of a specific branch
export async function notifyBranchManagers(
  branchId: string,
  type: NotificationType,
  title: string,
  body?: string,
  payload?: Record<string, any>
): Promise<void> {
  try {
    const managers = await db.user.findMany({
      where: { role: "BRANCH_MANAGER", branchId, active: true },
      select: { id: true },
    });
    await Promise.all(
      managers.map((m) =>
        createNotification({ userId: m.id, type, title, body, payload })
      )
    );
  } catch (err) {
    console.error("Failed to notify branch managers:", err);
  }
}

// Notify all central supervisors
export async function notifyCentralSupervisors(
  type: NotificationType,
  title: string,
  body?: string,
  payload?: Record<string, any>
): Promise<void> {
  try {
    const supervisors = await db.user.findMany({
      where: { role: "CENTRAL_SUPERVISOR", active: true },
      select: { id: true },
    });
    await Promise.all(
      supervisors.map((s) =>
        createNotification({ userId: s.id, type, title, body, payload })
      )
    );
  } catch (err) {
    console.error("Failed to notify central supervisors:", err);
  }
}

// Notify a specific user
export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  payload?: Record<string, any>
): Promise<void> {
  await createNotification({ userId, type, title, body, payload });
}
