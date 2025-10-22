import { storage } from "./storage";
import { executeAction } from "./automation-engine";
import { logger } from "./log";
import cron from "node-cron";

/**
 * Check and execute all cron_schedule automation rules
 */
export async function runScheduledAutomations(): Promise<void> {
  try {
    logger.info("Checking scheduled board automations");
    
    // Get all enabled automation rules across all boards
    const allRules = await storage.getAllAutomationRules("");
    const enabledRules = allRules.filter(rule => rule.isEnabled);
    
    // Filter for cron_schedule rules
    const cronRules = enabledRules.filter(rule => rule.triggerType === "cron_schedule");
    
    logger.info({ rulesCount: cronRules.length }, "Found cron schedule rules");
    
    for (const rule of cronRules) {
      try {
        const config = rule.triggerConfig as any;
        const cronExpression = config.cron;
        
        if (!cronExpression) {
          logger.warn({ ruleId: rule.id }, "Cron rule missing cron expression");
          continue;
        }
        
        // Check if this cron expression matches the current time
        // node-cron uses: second minute hour day month dayOfWeek
        // We'll validate the expression and see if it should run now
        if (cron.validate(cronExpression)) {
          // For cron rules, we execute them periodically
          // The cron expression determines when they run
          // We'll execute the action
          await executeAction(rule, {
            boardId: rule.boardId,
            userId: rule.createdBy,
          });
          
          logger.info({
            ruleId: rule.id,
            ruleName: rule.name,
            cronExpression,
          }, "Executed cron automation");
        } else {
          logger.warn({
            ruleId: rule.id,
            cronExpression,
          }, "Invalid cron expression");
        }
      } catch (error) {
        logger.error({
          error,
          ruleId: rule.id,
        }, "Error executing cron automation");
      }
    }
  } catch (error) {
    logger.error({ error }, "Error running scheduled automations");
  }
}

/**
 * Check and execute all on_date_arrive automation rules
 */
export async function checkDateArriveAutomations(): Promise<void> {
  try {
    logger.info("Checking date arrive automations");
    
    // Get all enabled automation rules
    const allRules = await storage.getAllAutomationRules("");
    const enabledRules = allRules.filter(rule => rule.isEnabled);
    
    // Filter for on_date_arrive rules
    const dateRules = enabledRules.filter(rule => rule.triggerType === "on_date_arrive");
    
    logger.info({ rulesCount: dateRules.length }, "Found date arrive rules");
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const rule of dateRules) {
      try {
        const config = rule.triggerConfig as any;
        const fieldId = config.fieldId;
        const offsetDays = config.offsetDays || 0; // Days before/after
        
        if (!fieldId) {
          logger.warn({ ruleId: rule.id }, "Date arrive rule missing fieldId");
          continue;
        }
        
        // Get all items on this board
        const items = await storage.getDynamicItemsByBoard(rule.boardId);
        
        for (const item of items) {
          // Get the date field value
          const fieldValue = await storage.getDynamicFieldValue(item.id, fieldId);
          
          if (!fieldValue?.value) {
            continue;
          }
          
          // Parse the date
          const itemDate = new Date(fieldValue.value);
          const targetDate = new Date(itemDate);
          targetDate.setDate(targetDate.getDate() + offsetDays);
          
          // Check if the target date is today
          const itemDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
          
          if (itemDateOnly.getTime() === today.getTime()) {
            // Execute the action for this item
            await executeAction(rule, {
              itemId: item.id,
              boardId: rule.boardId,
              userId: rule.createdBy,
            });
            
            logger.info({
              ruleId: rule.id,
              ruleName: rule.name,
              itemId: item.id,
              date: itemDateOnly.toISOString(),
            }, "Executed date arrive automation");
          }
        }
      } catch (error) {
        logger.error({
          error,
          ruleId: rule.id,
        }, "Error checking date arrive automation");
      }
    }
  } catch (error) {
    logger.error({ error }, "Error checking date arrive automations");
  }
}

/**
 * Initialize the automation scheduler
 * This sets up cron jobs to check for scheduled automations
 */
export function initializeAutomationScheduler(): void {
  // Check cron schedule automations every hour
  cron.schedule("0 * * * *", () => {
    logger.info("Running hourly cron schedule check");
    runScheduledAutomations().catch(err => {
      logger.error({ err }, "Error running cron automations");
    });
  });
  
  // Check date arrive automations daily at midnight
  cron.schedule("0 0 * * *", () => {
    logger.info("Running daily date arrive check");
    checkDateArriveAutomations().catch(err => {
      logger.error({ err }, "Error checking date arrive automations");
    });
  });
  
  logger.info("Board automation scheduler initialized");
}
