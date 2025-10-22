import { storage } from "./storage";
import type { BoardAutomationRule, DynamicItem, DynamicField } from "@shared/schema";
import { logger } from "./log";

// Trigger evaluation functions
export async function evaluateTrigger(
  rule: BoardAutomationRule,
  context: {
    eventType?: string;
    itemId?: string;
    fieldId?: string;
    oldValue?: string;
    newValue?: string;
    item?: DynamicItem;
  }
): Promise<boolean> {
  try {
    switch (rule.triggerType) {
      case "on_field_change":
        return evaluateFieldChangeTrigger(rule, context);
      
      case "on_item_create":
        return context.eventType === "item_created";
      
      case "on_date_arrive":
        // Date arrives triggers are evaluated by cron scheduler
        return false;
      
      case "cron_schedule":
        // Cron triggers are evaluated by cron scheduler
        return false;
      
      default:
        logger.warn({ triggerType: rule.triggerType }, "Unknown trigger type");
        return false;
    }
  } catch (error) {
    logger.error({ error, ruleId: rule.id }, "Error evaluating trigger");
    return false;
  }
}

function evaluateFieldChangeTrigger(
  rule: BoardAutomationRule,
  context: {
    fieldId?: string;
    oldValue?: string;
    newValue?: string;
  }
): boolean {
  const config = rule.triggerConfig as any;
  
  // Check if the field matches
  if (config.fieldId && config.fieldId !== context.fieldId) {
    return false;
  }
  
  // Check if the operator and value match
  const operator = config.operator || "=";
  const expectedValue = config.value;
  const actualValue = context.newValue;
  
  switch (operator) {
    case "=":
      return actualValue === expectedValue;
    case "!=":
      return actualValue !== expectedValue;
    case "contains":
      return actualValue?.includes(expectedValue) || false;
    case "not_contains":
      return !actualValue?.includes(expectedValue);
    default:
      return false;
  }
}

// Action execution functions
export async function executeAction(
  rule: BoardAutomationRule,
  context: {
    itemId?: string;
    boardId?: string;
    userId?: string;
  }
): Promise<void> {
  const startTime = Date.now();
  
  try {
    switch (rule.actionType) {
      case "notify_user":
        await executeNotifyUser(rule, context);
        break;
      
      case "set_field_value":
        await executeSetFieldValue(rule, context);
        break;
      
      case "create_item":
        await executeCreateItem(rule, context);
        break;
      
      case "send_email":
        await executeSendEmail(rule, context);
        break;
      
      case "call_webhook":
        await executeCallWebhook(rule, context);
        break;
      
      default:
        throw new Error(`Unknown action type: ${rule.actionType}`);
    }
    
    // Log successful execution
    await storage.createAutomationLog({
      ruleId: rule.id,
      actionType: rule.actionType,
      actionStatus: "success",
      details: {
        ...context,
        executionTimeMs: Date.now() - startTime,
      },
    });
    
    logger.info({
      ruleId: rule.id,
      actionType: rule.actionType,
      executionTimeMs: Date.now() - startTime,
    }, "Automation action executed successfully");
    
  } catch (error) {
    // Log failed execution
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await storage.createAutomationLog({
      ruleId: rule.id,
      actionType: rule.actionType,
      actionStatus: "failed",
      error: errorMessage,
      details: {
        ...context,
        executionTimeMs: Date.now() - startTime,
      },
    });
    
    logger.error({
      error,
      ruleId: rule.id,
      actionType: rule.actionType,
    }, "Automation action failed");
    
    throw error;
  }
}

async function executeNotifyUser(
  rule: BoardAutomationRule,
  context: { itemId?: string }
): Promise<void> {
  const config = rule.actionConfig as any;
  const userId = config.userId;
  const message = config.message || "Automation notification";
  
  // TODO: Implement in-app notification system
  logger.info({ userId, message, ruleId: rule.id }, "Notification would be sent");
  
  // For now, just log the notification
  // In a real implementation, this would:
  // - Create a notification record in the database
  // - Send a push notification
  // - Send a WebSocket message to the user
}

async function executeSetFieldValue(
  rule: BoardAutomationRule,
  context: { itemId?: string }
): Promise<void> {
  const config = rule.actionConfig as any;
  const fieldId = config.fieldId;
  const value = config.value;
  
  if (!context.itemId || !fieldId) {
    throw new Error("Item ID and field ID are required for set_field_value action");
  }
  
  await storage.setDynamicFieldValue({
    itemId: context.itemId,
    fieldId,
    value: String(value),
  });
  
  logger.info({
    itemId: context.itemId,
    fieldId,
    value,
  }, "Field value updated by automation");
}

async function executeCreateItem(
  rule: BoardAutomationRule,
  context: { userId?: string }
): Promise<void> {
  const config = rule.actionConfig as any;
  const boardId = config.boardId || rule.boardId;
  const itemName = config.itemName || "New Item";
  
  if (!context.userId) {
    throw new Error("User ID is required for create_item action");
  }
  
  const item = await storage.createDynamicItem({
    boardId,
    name: itemName,
    createdBy: context.userId,
  });
  
  logger.info({
    itemId: item.id,
    boardId,
    itemName,
  }, "Item created by automation");
}

async function executeSendEmail(
  rule: BoardAutomationRule,
  context: { itemId?: string }
): Promise<void> {
  const config = rule.actionConfig as any;
  const to = config.email || config.to;
  const subject = config.subject || "Automation Notification";
  const body = config.body || "";
  
  // TODO: Implement email sending via SMTP or service
  logger.info({ to, subject, ruleId: rule.id }, "Email would be sent");
  
  // In a real implementation, this would use nodemailer or an email service:
  // await sendEmail({ to, subject, body });
}

async function executeCallWebhook(
  rule: BoardAutomationRule,
  context: { itemId?: string; boardId?: string }
): Promise<void> {
  const config = rule.actionConfig as any;
  const url = config.url;
  const method = config.method || "POST";
  
  if (!url) {
    throw new Error("Webhook URL is required for call_webhook action");
  }
  
  // Prepare payload with context data
  const payload = {
    ruleId: rule.id,
    boardId: context.boardId || rule.boardId,
    itemId: context.itemId,
    timestamp: new Date().toISOString(),
    ...config.payload,
  };
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}`);
  }
  
  logger.info({
    url,
    method,
    status: response.status,
  }, "Webhook called successfully");
}

// Main function to check and execute automation rules
export async function checkAndExecuteAutomations(
  boardId: string,
  context: {
    eventType?: string;
    itemId?: string;
    fieldId?: string;
    oldValue?: string;
    newValue?: string;
    userId?: string;
  }
): Promise<void> {
  try {
    // Get all enabled rules for this board
    const rules = await storage.getBoardAutomationRules(boardId);
    const enabledRules = rules.filter(rule => rule.isEnabled);
    
    logger.debug({
      boardId,
      eventType: context.eventType,
      rulesCount: enabledRules.length,
    }, "Checking automation rules");
    
    // Evaluate and execute matching rules
    for (const rule of enabledRules) {
      const shouldExecute = await evaluateTrigger(rule, context);
      
      if (shouldExecute) {
        logger.info({
          ruleId: rule.id,
          ruleName: rule.name,
          triggerType: rule.triggerType,
        }, "Automation rule triggered");
        
        // Execute action asynchronously (don't wait)
        executeAction(rule, {
          itemId: context.itemId,
          boardId,
          userId: context.userId,
        }).catch(error => {
          logger.error({ error, ruleId: rule.id }, "Failed to execute automation action");
        });
      }
    }
  } catch (error) {
    logger.error({ error, boardId }, "Error checking automation rules");
  }
}
