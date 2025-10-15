import { AgentRegistry, type AgentPayload, type AgentConfig } from "./registry";
import { db } from "../db";
import { automationLogs } from "@shared/schema";
import type { User, Automation } from "@shared/schema";

export async function runAutomation(
  automation: Automation,
  payload: AgentPayload = {},
  user: User | null = null
) {
  const { action, actionConfig } = automation;
  const agent = AgentRegistry[action];

  if (!agent) {
    throw new Error(`Unknown action: ${action}`);
  }

  try {
    const result = await agent(payload, actionConfig as AgentConfig, user);

    await db.insert(automationLogs).values({
      automationId: automation.id,
      status: "ok",
      message: result.msg,
      context: payload,
    });

    console.log(`✅ Automation "${automation.name}" executed successfully:`, result.msg);
    return result;
  } catch (err: any) {
    const errorMsg = err?.message || "Unknown error";

    await db.insert(automationLogs).values({
      automationId: automation.id,
      status: "error",
      message: errorMsg,
      context: payload,
    });

    console.error(`⚠️ Automation "${automation.name}" error:`, errorMsg);
    return { ok: false, msg: errorMsg };
  }
}
