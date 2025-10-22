import cron from "node-cron";
import { storage } from "../storage";
import type { AgentRule, Task, Booking, Invoice, Proposal } from "@shared/schema";
import { logger } from "../logger";

interface EvaluationContext {
  rule: AgentRule;
  tasks?: Task[];
  bookings?: Booking[];
  invoices?: Invoice[];
  proposals?: Proposal[];
}

async function evaluateTaskOverdue(rule: AgentRule): Promise<{ userId: string; relatedId: string; data: any }[]> {
  const notifications: { userId: string; relatedId: string; data: any }[] = [];
  
  try {
    // Parse trigger condition
    const condition = JSON.parse(rule.triggerCondition);
    const daysOverdue = condition.days_overdue || 1;
    
    // Get all tasks (in a real scenario, we'd filter by owner)
    // For now, we'll get all tasks and check which are overdue
    const tasks = await storage.getAllTasks(""); // Would need to get all owners
    
    const now = new Date();
    const overdueDate = new Date(now.getTime() - daysOverdue * 24 * 60 * 60 * 1000);
    
    for (const task of tasks) {
      if (task.dueDate && new Date(task.dueDate) < overdueDate && task.status !== "completed") {
        // Check if we've already sent a notification for this task/rule combo
        const exists = await storage.checkNotificationExists(rule.id, task.id);
        if (!exists && task.assignedTo) {
          // Parse action data to get the message
          let actionData: any = {};
          try {
            actionData = JSON.parse(rule.actionData);
          } catch (e) {
            actionData = {
              message: `Task "${task.title}" is ${Math.ceil((now.getTime() - new Date(task.dueDate).getTime()) / (24 * 60 * 60 * 1000))} days overdue`,
              title: "Overdue Task Reminder",
            };
          }
          
          notifications.push({
            userId: task.assignedTo,
            relatedId: task.id,
            data: actionData,
          });
        }
      }
    }
  } catch (error) {
    logger.error({ error, rule: rule.id }, "Error evaluating task_overdue rule");
  }
  
  return notifications;
}

async function evaluateBookingUpcoming(rule: AgentRule): Promise<{ userId: string; relatedId: string; data: any }[]> {
  const notifications: { userId: string; relatedId: string; data: any }[] = [];
  
  try {
    // Parse trigger condition
    const condition = JSON.parse(rule.triggerCondition);
    const daysAhead = condition.days_ahead || 7;
    
    // Get upcoming bookings
    const bookings = await storage.getUpcomingBookings(100);
    
    const now = new Date();
    const upcomingDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    for (const booking of bookings) {
      const bookingDate = new Date(booking.startTime);
      if (bookingDate <= upcomingDate && bookingDate > now) {
        // Check if we've already sent a notification for this booking/rule combo
        const exists = await storage.checkNotificationExists(rule.id, booking.id);
        if (!exists) {
          // Get the client to find the owner
          const client = await storage.getClient(booking.clientId, "");
          if (client) {
            let actionData: any = {};
            try {
              actionData = JSON.parse(rule.actionData);
            } catch (e) {
              actionData = {
                message: `Booking for client is coming up in ${Math.ceil((bookingDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))} days`,
                title: "Upcoming Booking Reminder",
              };
            }
            
            notifications.push({
              userId: client.ownerId,
              relatedId: booking.id,
              data: actionData,
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error({ error, rule: rule.id }, "Error evaluating booking_upcoming rule");
  }
  
  return notifications;
}

async function evaluateInvoiceUnpaid(rule: AgentRule): Promise<{ userId: string; relatedId: string; data: any }[]> {
  const notifications: { userId: string; relatedId: string; data: any }[] = [];
  
  try {
    // Parse trigger condition
    const condition = JSON.parse(rule.triggerCondition);
    const daysOverdue = condition.days_overdue || 30;
    
    // Get all invoices (would need to filter by owner in real scenario)
    const invoices = await storage.getAllInvoices("");
    
    const now = new Date();
    const overdueDate = new Date(now.getTime() - daysOverdue * 24 * 60 * 60 * 1000);
    
    for (const invoice of invoices) {
      if (invoice.status === "pending" && invoice.dueDate && new Date(invoice.dueDate) < overdueDate) {
        // Check if we've already sent a notification for this invoice/rule combo
        const exists = await storage.checkNotificationExists(rule.id, invoice.id);
        if (!exists) {
          let actionData: any = {};
          try {
            actionData = JSON.parse(rule.actionData);
          } catch (e) {
            actionData = {
              message: `Invoice #${invoice.invoiceNumber} is ${Math.ceil((now.getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1000))} days overdue`,
              title: "Unpaid Invoice Alert",
            };
          }
          
          notifications.push({
            userId: invoice.ownerId,
            relatedId: invoice.id,
            data: actionData,
          });
        }
      }
    }
  } catch (error) {
    logger.error({ error, rule: rule.id }, "Error evaluating invoice_unpaid rule");
  }
  
  return notifications;
}

async function evaluateProposalPending(rule: AgentRule): Promise<{ userId: string; relatedId: string; data: any }[]> {
  const notifications: { userId: string; relatedId: string; data: any }[] = [];
  
  try {
    // Parse trigger condition
    const condition = JSON.parse(rule.triggerCondition);
    const daysPending = condition.days_pending || 7;
    
    // Get all proposals (would need to filter by owner in real scenario)
    const proposals = await storage.getAllProposals("");
    
    const now = new Date();
    const pendingDate = new Date(now.getTime() - daysPending * 24 * 60 * 60 * 1000);
    
    for (const proposal of proposals) {
      if (proposal.status === "sent" && new Date(proposal.createdAt) < pendingDate) {
        // Check if we've already sent a notification for this proposal/rule combo
        const exists = await storage.checkNotificationExists(rule.id, proposal.id);
        if (!exists) {
          let actionData: any = {};
          try {
            actionData = JSON.parse(rule.actionData);
          } catch (e) {
            actionData = {
              message: `Proposal has been pending for ${Math.ceil((now.getTime() - new Date(proposal.createdAt).getTime()) / (24 * 60 * 60 * 1000))} days`,
              title: "Pending Proposal Follow-Up",
            };
          }
          
          notifications.push({
            userId: proposal.ownerId,
            relatedId: proposal.id,
            data: actionData,
          });
        }
      }
    }
  } catch (error) {
    logger.error({ error, rule: rule.id }, "Error evaluating proposal_pending rule");
  }
  
  return notifications;
}

async function evaluateRule(rule: AgentRule): Promise<void> {
  logger.info({ ruleId: rule.id, type: rule.triggerType }, "Evaluating agent rule");
  
  let notificationsToSend: { userId: string; relatedId: string; data: any }[] = [];
  
  // Evaluate based on trigger type
  switch (rule.triggerType) {
    case "task_overdue":
      notificationsToSend = await evaluateTaskOverdue(rule);
      break;
    case "booking_upcoming":
      notificationsToSend = await evaluateBookingUpcoming(rule);
      break;
    case "invoice_unpaid":
      notificationsToSend = await evaluateInvoiceUnpaid(rule);
      break;
    case "proposal_pending":
      notificationsToSend = await evaluateProposalPending(rule);
      break;
    case "staff_idle":
    case "client_unresponsive":
      // TODO: Implement these trigger types
      logger.info({ type: rule.triggerType }, "Trigger type not yet implemented");
      break;
    default:
      logger.warn({ type: rule.triggerType }, "Unknown trigger type");
  }
  
  // Create notification logs for each notification to send
  for (const notification of notificationsToSend) {
    try {
      await storage.createAgentNotificationLog({
        ruleId: rule.id,
        userId: notification.userId,
        relatedType: rule.triggerType.split("_")[0], // e.g., "task", "booking", "invoice"
        relatedId: notification.relatedId,
        deliveryChannel: rule.deliveryChannel,
        actionData: JSON.stringify(notification.data),
        status: "sent",
        triggeredAt: new Date(),
      });
      
      logger.info(
        { ruleId: rule.id, userId: notification.userId, relatedId: notification.relatedId },
        "Agent notification created"
      );
    } catch (error) {
      logger.error({ error, ruleId: rule.id }, "Error creating agent notification log");
    }
  }
}

export async function runAgentEvaluation(): Promise<void> {
  logger.info("Starting agent evaluation cycle");
  
  try {
    // Get all active agent rules
    const rules = await storage.getActiveAgentRules();
    logger.info({ count: rules.length }, "Found active agent rules");
    
    // Evaluate each rule
    for (const rule of rules) {
      await evaluateRule(rule);
    }
    
    logger.info("Agent evaluation cycle completed");
  } catch (error) {
    logger.error({ error }, "Error running agent evaluation");
  }
}

// Schedule agent evaluation to run every 5 minutes
export function startAgentScheduler(): void {
  logger.info("Starting agent scheduler");
  
  // Run every 5 minutes
  cron.schedule("*/5 * * * *", () => {
    runAgentEvaluation();
  });
  
  // Also run immediately on startup
  runAgentEvaluation();
}
