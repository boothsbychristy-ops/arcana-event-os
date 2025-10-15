import { eq } from "drizzle-orm";
import { db } from "../db";
import { tasks, subtasks } from "@shared/schema";
import type { User } from "@shared/schema";

export interface AgentPayload {
  taskId?: string;
  message?: string;
  newStatus?: string;
  subtasks?: string[];
  [key: string]: any;
}

export interface AgentConfig {
  [key: string]: any;
}

export interface AgentResult {
  ok: boolean;
  msg: string;
}

export type AgentHandler = (
  payload: AgentPayload,
  config: AgentConfig,
  user: User | null
) => Promise<AgentResult>;

export const AgentRegistry: Record<string, AgentHandler> = {
  send_notification: async (payload, config, user) => {
    console.log("📨 Notification Agent:", payload?.message || "No message", "for user:", user?.email);
    return { ok: true, msg: `Notification sent: ${payload?.message || "default"}` };
  },

  update_status: async (payload, config) => {
    const { taskId, newStatus } = payload || {};
    if (!taskId) return { ok: false, msg: "no taskId provided" };
    if (!newStatus) return { ok: false, msg: "no newStatus provided" };

    await db
      .update(tasks)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(tasks.id, taskId));

    return { ok: true, msg: `Task ${taskId} updated to ${newStatus}` };
  },

  create_subtasks: async (payload, config) => {
    const { taskId, subtasks: subtaskTitles = [] } = payload || {};
    if (!taskId) return { ok: false, msg: "no taskId provided" };
    if (subtaskTitles.length === 0) return { ok: false, msg: "no subtasks provided" };

    for (const title of subtaskTitles) {
      await db.insert(subtasks).values({
        taskId,
        title,
        isCompleted: false,
      });
    }

    return { ok: true, msg: `${subtaskTitles.length} subtask(s) created for task ${taskId}` };
  },
};
