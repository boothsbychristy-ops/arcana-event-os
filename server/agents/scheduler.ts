import { eq, and, ne, lt } from "drizzle-orm";
import { db } from "../db";
import { automations, tasks } from "@shared/schema";
import { runAutomation } from "./engine";
import type { Automation, Task } from "@shared/schema";

export async function runScheduledAutomations() {
  console.log("🤖 Running scheduled automations...");

  const scheduledAutomations = await db
    .select()
    .from(automations)
    .where(
      and(
        eq(automations.isEnabled, true),
        eq(automations.runScope, "scheduled")
      )
    );

  for (const automation of scheduledAutomations) {
    if (automation.triggerEvent === "task.due_soon") {
      const dueSoonTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            ne(tasks.status, "done"),
            lt(tasks.dueAt, new Date(Date.now() + 24 * 60 * 60 * 1000))
          )
        );

      for (const task of dueSoonTasks) {
        await runAutomation(automation, {
          taskId: task.id,
          message: `Task "${task.title}" is due soon!`,
        });
      }

      console.log(`✅ Processed ${dueSoonTasks.length} due-soon tasks for automation "${automation.name}"`);
    }
  }
}
