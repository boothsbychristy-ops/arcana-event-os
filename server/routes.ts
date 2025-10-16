import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, or } from "drizzle-orm";
import { users as usersTable } from "@shared/schema";
import { z } from "zod";
import {
  insertClientSchema,
  insertStaffSchema,
  insertProposalSchema,
  insertBookingSchema,
  insertBookingStaffSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
  insertPaymentSettingsSchema,
  insertPaymentMethodSchema,
  insertPaymentPlanSchema,
  insertBookingEngineSettingsSchema,
  insertBookingQuestionSchema,
  insertBookingResponseSchema,
  insertUnavailableNoticeSchema,
  insertPrivacySettingsSchema,
  insertBoardSchema,
  insertBoardGroupSchema,
  insertTaskStatusSchema,
  insertTaskSchema,
  insertTaskCommentSchema,
  insertTaskAttachmentSchema,
  insertSubtaskSchema,
  insertTaskActivitySchema,
  insertBoardMemberSchema,
  insertMessageSchema,
  insertDeliverableSchema,
  insertLeadSchema,
  insertStaffApplicationSchema,
  insertApprovalSchema,
  loginSchema,
  signupSchema,
} from "@shared/schema";
import {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  roleMiddleware,
  type AuthRequest,
} from "./auth";

// Helper function to trigger automations
async function triggerAutomationEvent(
  event: string,
  payload: any,
  ownerId: string
) {
  try {
    const { runAutomation } = await import("./agents/engine");
    const { automations } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const matchingAutomations = await db.select().from(automations).where(
      and(
        eq(automations.ownerId, ownerId),
        eq(automations.isEnabled, true),
        eq(automations.triggerEvent, event),
        eq(automations.runScope, "immediate")
      )
    );

    for (const automation of matchingAutomations) {
      runAutomation(automation, payload).catch((err) => {
        console.error(`Error running automation ${automation.id}:`, err);
      });
    }
  } catch (error) {
    console.error("Error triggering automation event:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.strict().parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user with forced 'client' role (security: prevent privilege escalation)
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        role: "client", // Always force 'client' role on signup
      });

      // Generate token
      const token = generateToken(user);

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.strict().parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check password
      const validPassword = await comparePassword(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate token
      const token = generateToken(user);

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    // Client-side will remove the token
    res.json({ success: true });
  });

  // Admin-only: Update user role (security: requires owner/admin)
  app.patch("/api/users/:id/role", authMiddleware, roleMiddleware("owner", "admin"), async (req: AuthRequest, res) => {
    try {
      const roleUpdateSchema = z.object({
        role: z.enum(["owner", "admin", "staff", "client"])
      });
      
      const data = roleUpdateSchema.strict().parse(req.body);
      const userId = req.params.id;
      
      const updatedUser = await storage.updateUser(userId, { role: data.role });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Public Registration Endpoints (no auth required)
  app.post("/api/public/register", async (req, res) => {
    try {
      // Honeypot spam protection
      if (req.body.honeypot) {
        return res.status(400).json({ error: "Invalid submission" });
      }

      const data = insertLeadSchema.strict().parse(req.body);
      
      // Require ownerId in request for multi-tenant support
      // In production, this would come from the subdomain or public booking page context
      if (!data.ownerId) {
        return res.status(400).json({ error: "Owner context required" });
      }

      const lead = await storage.createLead(data);
      res.json({ success: true, leadId: lead.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to submit registration" });
    }
  });

  app.post("/api/public/staff-apply", async (req, res) => {
    try {
      // Honeypot spam protection
      if (req.body.honeypot) {
        return res.status(400).json({ error: "Invalid submission" });
      }

      const data = insertStaffApplicationSchema.strict().parse(req.body);
      
      // Require ownerId in request for multi-tenant support
      if (!data.ownerId) {
        return res.status(400).json({ error: "Owner context required" });
      }

      const application = await storage.createStaffApplication(data);
      res.json({ success: true, applicationId: application.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  // Apply auth middleware to all routes below this point
  app.use("/api/*", authMiddleware);
  
  // Dashboard
  app.get("/api/dashboard/stats", async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/revenue", async (req, res) => {
    try {
      const revenue = await storage.getRevenueByMonth();
      res.json(revenue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/dashboard/upcoming-bookings", async (req, res) => {
    try {
      const bookings = await storage.getUpcomingBookings(5);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming bookings" });
    }
  });

  // Clients
  app.get("/api/clients", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const clients = await storage.getAllClients(req.user!.id);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClient(req.params.id, req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertClientSchema.strict().parse({
        ...req.body,
        ownerId: req.user!.id
      });
      const client = await storage.createClient(data);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertClientSchema.partial().strict().parse(req.body);
      const client = await storage.updateClient(req.params.id, req.user!.id, data);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteClient(req.params.id, req.user!.id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Staff
  app.get("/api/staff", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const staff = await storage.getAllStaff(req.user!.id);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const staff = await storage.getStaff(req.params.id, req.user!.id);
      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      let data = { ...req.body };
      
      // If userId looks like an email, look up the user ID
      if (data.userId && data.userId.includes('@')) {
        const user = await storage.getUserByEmail(data.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found with that email" });
        }
        data.userId = user.id;
      }
      
      const validatedData = insertStaffSchema.strict().parse(data);
      const staff = await storage.createStaff(validatedData);
      res.json(staff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create staff" });
    }
  });

  app.patch("/api/staff/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertStaffSchema.partial().strict().parse(req.body);
      const staff = await storage.updateStaff(req.params.id, req.user!.id, data);
      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }
      res.json(staff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update staff" });
    }
  });

  // Proposals
  app.get("/api/proposals", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const proposals = await storage.getAllProposals(req.user!.id);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch proposals" });
    }
  });

  app.get("/api/proposals/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const proposal = await storage.getProposal(req.params.id, req.user!.id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch proposal" });
    }
  });

  app.post("/api/proposals", async (req, res) => {
    try {
      const data = insertProposalSchema.strict().parse(req.body);
      const proposal = await storage.createProposal(data);
      res.json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create proposal" });
    }
  });

  app.patch("/api/proposals/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertProposalSchema.partial().strict().parse(req.body);
      const proposal = await storage.updateProposal(req.params.id, req.user!.id, data);
      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update proposal" });
    }
  });

  app.post("/api/proposals/:id/convert-to-booking", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.convertProposalToBooking(req.params.id, req.user!.id);
      res.json(booking);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to convert proposal to booking" });
    }
  });

  // Bookings
  app.get("/api/bookings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const bookings = await storage.getAllBookings(req.user!.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.getBooking(req.params.id, req.user!.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const data = insertBookingSchema.strict().parse(req.body);
      const booking = await storage.createBooking(data);
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertBookingSchema.partial().strict().parse(req.body);
      const booking = await storage.updateBooking(req.params.id, req.user!.id, data);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // Booking Staff Assignments
  app.get("/api/bookings/:id/staff", authMiddleware, async (req, res) => {
    try {
      const staff = await storage.getBookingStaff(req.params.id);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking staff" });
    }
  });

  app.post("/api/bookings/:id/staff", authMiddleware, async (req, res) => {
    try {
      const data = insertBookingStaffSchema.strict().parse({ ...req.body, bookingId: req.params.id });
      const assignment = await storage.assignStaffToBooking(data);
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to assign staff" });
    }
  });

  app.delete("/api/bookings/:bookingId/staff/:staffId", authMiddleware, async (req, res) => {
    try {
      // Find the assignment ID for this booking + staff combination
      const assignments = await storage.getBookingStaff(req.params.bookingId);
      const assignment = assignments.find(a => a.staffId === req.params.staffId);
      
      if (!assignment) {
        return res.status(404).json({ error: "Staff assignment not found" });
      }
      
      const success = await storage.removeStaffFromBooking(assignment.id);
      if (!success) {
        return res.status(404).json({ error: "Failed to remove assignment" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove staff assignment" });
    }
  });

  // Invoices
  app.get("/api/invoices", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const invoices = await storage.getAllInvoices(req.user!.id);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.user!.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.get("/api/invoices/booking/:bookingId", authMiddleware, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceByBooking(req.params.bookingId);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", authMiddleware, async (req, res) => {
    try {
      const data = insertInvoiceSchema.strict().parse(req.body);
      const invoice = await storage.createInvoice(data);
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Generate invoice from booking
  app.post("/api/bookings/:id/generate-invoice", authMiddleware, async (req: AuthRequest, res) => {
    try {
      // Check if invoice already exists for this booking
      const existing = await storage.getInvoiceByBooking(req.params.id);
      if (existing) {
        return res.status(400).json({ error: "Invoice already exists for this booking" });
      }

      // Get booking details
      const booking = await storage.getBooking(req.params.id, req.user!.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Generate invoice number (simple timestamp-based)
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create invoice with booking data
      const invoice = await storage.createInvoice({
        ownerId: booking.ownerId,
        bookingId: booking.id,
        clientId: booking.clientId,
        invoiceNumber,
        status: "draft",
        subtotal: "0",
        tax: "0",
        total: "0",
        amountPaid: "0",
        balance: "0",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  app.patch("/api/invoices/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertInvoiceSchema.partial().strict().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, req.user!.id, data);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  // Invoice Items
  app.get("/api/invoices/:id/items", async (req, res) => {
    try {
      const items = await storage.getInvoiceItems(req.params.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice items" });
    }
  });

  app.post("/api/invoices/:id/items", async (req, res) => {
    try {
      const data = insertInvoiceItemSchema.strict().parse({ ...req.body, invoiceId: req.params.id });
      const item = await storage.createInvoiceItem(data);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create invoice item" });
    }
  });

  // Payments
  app.get("/api/payments/invoice/:invoiceId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByInvoice(req.params.invoiceId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const data = insertPaymentSchema.strict().parse(req.body);
      const payment = await storage.createPayment(data);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Payment Settings
  app.get("/api/payment-settings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getAllPaymentSettings(req.user!.id);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment settings" });
    }
  });

  app.post("/api/payment-settings", async (req, res) => {
    try {
      const data = insertPaymentSettingsSchema.strict().parse(req.body);
      const settings = await storage.upsertPaymentSettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save payment settings" });
    }
  });

  // Payment Methods
  app.get("/api/payment-methods", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const methods = await storage.getAllPaymentMethods(req.user!.id);
      res.json(methods);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  app.patch("/api/payment-methods/:id", async (req, res) => {
    try {
      const method = await storage.updatePaymentMethod(req.params.id, req.body);
      if (!method) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      res.json(method);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });

  // Payment Plans
  app.get("/api/payment-plans", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const plans = await storage.getAllPaymentPlans(req.user!.id);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment plans" });
    }
  });

  app.post("/api/payment-plans", async (req, res) => {
    try {
      const data = insertPaymentPlanSchema.strict().parse(req.body);
      const plan = await storage.createPaymentPlan(data);
      res.json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create payment plan" });
    }
  });

  // Booking Engine Settings
  app.get("/api/booking-engine-settings", async (req, res) => {
    try {
      const settings = await storage.getBookingEngineSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking engine settings" });
    }
  });

  app.post("/api/booking-engine-settings", async (req, res) => {
    try {
      const data = insertBookingEngineSettingsSchema.strict().parse(req.body);
      const settings = await storage.upsertBookingEngineSettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save booking engine settings" });
    }
  });

  // Booking Questions
  app.get("/api/booking-questions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const questions = await storage.getAllBookingQuestions(req.user!.id);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking questions" });
    }
  });

  app.post("/api/booking-questions", async (req, res) => {
    try {
      const data = insertBookingQuestionSchema.strict().parse(req.body);
      const question = await storage.createBookingQuestion(data);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking question" });
    }
  });

  app.patch("/api/booking-questions/:id", async (req, res) => {
    try {
      const question = await storage.updateBookingQuestion(req.params.id, req.body);
      if (!question) {
        return res.status(404).json({ error: "Booking question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking question" });
    }
  });

  // Unavailable Notices
  app.get("/api/unavailable-notices", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const notices = await storage.getAllUnavailableNotices(req.user!.id);
      res.json(notices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unavailable notices" });
    }
  });

  app.post("/api/unavailable-notices", async (req, res) => {
    try {
      const data = insertUnavailableNoticeSchema.strict().parse(req.body);
      const notice = await storage.createUnavailableNotice(data);
      res.json(notice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create unavailable notice" });
    }
  });

  app.patch("/api/unavailable-notices/:id", async (req, res) => {
    try {
      const notice = await storage.updateUnavailableNotice(req.params.id, req.body);
      if (!notice) {
        return res.status(404).json({ error: "Unavailable notice not found" });
      }
      res.json(notice);
    } catch (error) {
      res.status(500).json({ error: "Failed to update unavailable notice" });
    }
  });

  // Privacy Settings
  app.get("/api/privacy-settings", async (req, res) => {
    try {
      const settings = await storage.getPrivacySettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch privacy settings" });
    }
  });

  app.post("/api/privacy-settings", async (req, res) => {
    try {
      const data = insertPrivacySettingsSchema.strict().parse(req.body);
      const settings = await storage.upsertPrivacySettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save privacy settings" });
    }
  });

  // Boards
  app.get("/api/boards", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const boards = await storage.getAllBoards(req.user!.id);
      res.json(boards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch boards" });
    }
  });

  app.get("/api/boards/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const boardData = await storage.getBoardWithDetails(req.params.id, req.user!.id);
      if (!boardData) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(boardData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch board" });
    }
  });

  app.post("/api/boards", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertBoardSchema.strict().parse({ ...req.body, ownerId: req.user!.id });
      const board = await storage.createBoard(data);
      res.json(board);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create board" });
    }
  });

  app.patch("/api/boards/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertBoardSchema.partial().strict().parse(req.body);
      const board = await storage.updateBoard(req.params.id, req.user!.id, data);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update board" });
    }
  });

  app.delete("/api/boards/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteBoard(req.params.id, req.user!.id);
      if (!success) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete board" });
    }
  });

  // Board Groups
  app.post("/api/boards/:id/groups", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertBoardGroupSchema.strict().parse({ ...req.body, boardId: req.params.id });
      const group = await storage.createBoardGroup(data);
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.patch("/api/boards/:id/groups/:groupId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertBoardGroupSchema.partial().strict().parse(req.body);
      const group = await storage.updateBoardGroup(req.params.groupId, data);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  app.delete("/api/boards/:id/groups/:groupId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteBoardGroup(req.params.groupId);
      if (!success) {
        return res.status(404).json({ error: "Group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // Task Statuses
  app.post("/api/boards/:id/statuses", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTaskStatusSchema.strict().parse({ ...req.body, boardId: req.params.id });
      const status = await storage.createTaskStatus(data);
      res.json(status);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create status" });
    }
  });

  // Assignable Users (for task assignment)
  app.get("/api/users/assignable", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const users = await db.select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        role: usersTable.role,
        avatarUrl: usersTable.avatarUrl,
      })
      .from(usersTable)
      .where(
        or(
          eq(usersTable.role, "owner"),
          eq(usersTable.role, "admin"),
          eq(usersTable.role, "staff")
        )
      );
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignable users" });
    }
  });

  // Tasks
  app.get("/api/tasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getAllTasks(req.user!.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/booking/:bookingId", async (req, res) => {
    try {
      const tasks = await storage.getTasksByBooking(req.params.bookingId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking tasks" });
    }
  });

  app.post("/api/tasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const ownerId = user.id; // For owners, id IS ownerId. For staff, they create tasks under owner's account
      
      const data = insertTaskSchema.strict().parse(req.body);
      const task = await storage.createTask({ ...data, ownerId });

      // Trigger task.created automation
      triggerAutomationEvent('task.created', {
        taskId: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
      }, ownerId);

      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.get("/api/tasks/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const oldTask = await storage.getTask(req.params.id);
      const data = insertTaskSchema.partial().strict().parse(req.body);
      const task = await storage.updateTask(req.params.id, data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Trigger task.status_changed automation if status changed
      if (oldTask && data.status && oldTask.status !== data.status && task.ownerId) {
        triggerAutomationEvent('task.status_changed', {
          taskId: task.id,
          title: task.title,
          newStatus: task.status,
          oldStatus: oldTask.status,
        }, task.ownerId);
      }

      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.post("/api/tasks/:id/move", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { toGroupId, toIndex } = req.body;
      if (!toGroupId || toIndex === undefined) {
        return res.status(400).json({ error: "toGroupId and toIndex are required" });
      }
      const task = await storage.moveTask(req.params.id, toGroupId, toIndex);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to move task" });
    }
  });

  // Task Comments
  app.get("/api/tasks/:taskId/comments", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const comments = await storage.getTaskComments(req.params.taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTaskCommentSchema.strict().parse({ ...req.body, taskId: req.params.taskId, userId: req.user!.id });
      const comment = await storage.createTaskComment(data);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.patch("/api/tasks/:taskId/comments/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTaskCommentSchema.partial().strict().parse(req.body);
      const comment = await storage.updateTaskComment(req.params.id, data);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/tasks/:taskId/comments/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const deleted = await storage.deleteTaskComment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Task Attachments
  app.get("/api/tasks/:taskId/attachments", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const attachments = await storage.getTaskAttachments(req.params.taskId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  app.post("/api/tasks/:taskId/attachments", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTaskAttachmentSchema.strict().parse({ ...req.body, taskId: req.params.taskId, userId: req.user!.id });
      const attachment = await storage.createTaskAttachment(data);
      res.json(attachment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create attachment" });
    }
  });

  app.delete("/api/tasks/:taskId/attachments/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const deleted = await storage.deleteTaskAttachment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // Subtasks
  app.get("/api/tasks/:taskId/subtasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const subtasks = await storage.getSubtasks(req.params.taskId);
      res.json(subtasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subtasks" });
    }
  });

  app.post("/api/tasks/:taskId/subtasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertSubtaskSchema.strict().parse({ ...req.body, taskId: req.params.taskId });
      const subtask = await storage.createSubtask(data);
      res.json(subtask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create subtask" });
    }
  });

  app.patch("/api/tasks/:taskId/subtasks/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertSubtaskSchema.partial().strict().parse(req.body);
      const subtask = await storage.updateSubtask(req.params.id, data);
      if (!subtask) {
        return res.status(404).json({ error: "Subtask not found" });
      }
      res.json(subtask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update subtask" });
    }
  });

  app.delete("/api/tasks/:taskId/subtasks/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const deleted = await storage.deleteSubtask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Subtask not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subtask" });
    }
  });

  // Task Activity
  app.get("/api/tasks/:taskId/activity", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const activity = await storage.getTaskActivity(req.params.taskId);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.post("/api/tasks/:taskId/activity", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTaskActivitySchema.strict().parse({ ...req.body, taskId: req.params.taskId, userId: req.user!.id });
      const activity = await storage.createTaskActivity(data);
      res.json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  // Board Members
  app.get("/api/boards/:boardId/members", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const members = await storage.getBoardMembers(req.params.boardId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch board members" });
    }
  });

  app.post("/api/boards/:boardId/members", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertBoardMemberSchema.strict().parse({ ...req.body, boardId: req.params.boardId });
      const member = await storage.addBoardMember(data);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  app.patch("/api/boards/:boardId/members/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertBoardMemberSchema.partial().strict().parse(req.body);
      const member = await storage.updateBoardMember(req.params.id, data);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  app.delete("/api/boards/:boardId/members/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const deleted = await storage.removeBoardMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  // Calendar
  app.get("/api/calendar/tasks", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { from, to, assignee_id, client_id, status, priority } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ error: "from and to query parameters are required" });
      }

      const user = req.user!;
      const ownerId = user.id; // For owners, id IS ownerId

      const filters = {
        ownerId,
        from: new Date(from as string),
        to: new Date(to as string),
        assigneeId: assignee_id as string | undefined,
        clientId: client_id as string | undefined,
        status: status as string | undefined,
        priority: priority as string | undefined,
      };

      // For staff, only show tasks assigned to them
      if (user.role === 'staff') {
        filters.assigneeId = user.id;
      }

      const events = await storage.getCalendarTasks(filters);
      res.json(events);
    } catch (error) {
      console.error('Calendar tasks error:', error);
      res.status(500).json({ error: "Failed to fetch calendar tasks" });
    }
  });

  app.patch("/api/tasks/:id/dates", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { start, end } = req.body;
      
      if (!start) {
        return res.status(400).json({ error: "start date is required" });
      }

      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const oldStart = task.dueAt?.toISOString();
      const newStart = new Date(start).toISOString();

      const updated = await storage.updateTask(req.params.id, {
        dueAt: new Date(start),
      });

      // Log the activity
      await storage.createTaskActivity({
        taskId: req.params.id,
        userId: req.user!.id,
        action: 'date_changed',
        details: JSON.stringify({
          oldStart,
          newStart,
          oldEnd: end ? oldStart : null,
          newEnd: end ? new Date(end).toISOString() : null,
        }),
      });

      res.json(updated);
    } catch (error) {
      console.error('Update task dates error:', error);
      res.status(500).json({ error: "Failed to update task dates" });
    }
  });

  // Messages
  app.get("/api/messages", async (req, res) => {
    try {
      const audience = req.query.audience as string || "internal";
      const messages = await storage.getMessagesByAudience(audience);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/booking/:bookingId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByBooking(req.params.bookingId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const data = insertMessageSchema.strict().parse(req.body);
      const message = await storage.createMessage(data);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Deliverables
  app.get("/api/bookings/:id/deliverables", authMiddleware, async (req, res) => {
    try {
      const deliverables = await storage.getDeliverablesByBooking(req.params.id);
      res.json(deliverables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliverables" });
    }
  });

  app.post("/api/bookings/:id/deliverables", authMiddleware, async (req, res) => {
    try {
      const data = insertDeliverableSchema.strict().parse({
        ...req.body,
        bookingId: req.params.id,
      });
      const deliverable = await storage.createDeliverable(data);
      res.json(deliverable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create deliverable" });
    }
  });

  app.delete("/api/deliverables/:id", authMiddleware, async (req, res) => {
    try {
      const success = await storage.deleteDeliverable(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Deliverable not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deliverable" });
    }
  });

  // Leads
  app.get("/api/leads", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const leads = await storage.getAllLeads(req.user!.id);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.patch("/api/leads/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      // Check if this is a conversion request
      if (req.body.action === "convert") {
        const result = await storage.convertLeadToClient(req.params.id);
        return res.json(result);
      }
      
      const data = insertLeadSchema.partial().strict().parse(req.body);
      const lead = await storage.updateLead(req.params.id, data);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.post("/api/leads/:id/convert", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await storage.convertLeadToClient(req.params.id);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to convert lead" });
    }
  });

  // Staff Applications
  app.get("/api/staff-applications", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const applications = await storage.getAllStaffApplications(req.user!.id);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff applications" });
    }
  });

  app.get("/api/staff-applications/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const application = await storage.getStaffApplication(req.params.id, req.user!.id);
      if (!application) {
        return res.status(404).json({ error: "Staff application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff application" });
    }
  });

  app.post("/api/staff-applications/:id/approve", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await storage.approveStaffApplication(req.params.id, req.user!.id);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to approve application" });
    }
  });

  app.post("/api/staff-applications/:id/reject", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const application = await storage.rejectStaffApplication(req.params.id, req.user!.id);
      if (!application) {
        return res.status(404).json({ error: "Staff application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject application" });
    }
  });

  // Automations routes
  app.get("/api/automations", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const automations = await storage.getAllAutomations(req.user!.id);
      res.json(automations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch automations" });
    }
  });

  app.post("/api/automations", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const automation = await storage.createAutomation({
        ...req.body,
        ownerId: req.user!.id,
      });
      res.json(automation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create automation" });
    }
  });

  app.patch("/api/automations/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const automation = await storage.updateAutomation(req.params.id, req.body);
      if (!automation) {
        return res.status(404).json({ error: "Automation not found" });
      }
      res.json(automation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update automation" });
    }
  });

  app.patch("/api/automations/:id/toggle", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const automation = await storage.toggleAutomation(req.params.id);
      if (!automation) {
        return res.status(404).json({ error: "Automation not found" });
      }
      res.json(automation);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle automation" });
    }
  });

  app.delete("/api/automations/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteAutomation(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Automation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete automation" });
    }
  });

  app.get("/api/automations/logs", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const automationId = req.query.automationId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getAutomationLogs(automationId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch automation logs" });
    }
  });

  app.post("/api/automations/:id/run", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const automation = await storage.getAutomation(req.params.id);
      if (!automation) {
        return res.status(404).json({ error: "Automation not found" });
      }

      const { runAutomation } = await import("./agents/engine");
      const result = await runAutomation(automation, req.body.payload || {});
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to run automation" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/summary", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = req.query.to ? new Date(req.query.to as string) : new Date();
      const user = req.user!;
      const ownerId = user.id; // For owners, id IS ownerId
      const staffId = user.role === 'staff' ? user.id : undefined;
      
      const summary = await storage.getAnalyticsSummary(from, to, ownerId, staffId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });

  app.get("/api/analytics/revenue-series", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const interval = (req.query.interval as 'day' | 'week' | 'month') || 'month';
      const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const to = req.query.to ? new Date(req.query.to as string) : new Date();
      const user = req.user!;
      const ownerId = user.id; // For owners, id IS ownerId
      
      const series = await storage.getRevenueSeries(interval, from, to, ownerId);
      res.json(series);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue series" });
    }
  });

  app.get("/api/analytics/staff-performance", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = req.query.to ? new Date(req.query.to as string) : new Date();
      const user = req.user!;
      const ownerId = user.id; // For owners, id IS ownerId
      
      const performance = await storage.getStaffPerformance(from, to, ownerId);
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff performance" });
    }
  });

  app.get("/api/analytics/status-distribution", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = req.query.to ? new Date(req.query.to as string) : new Date();
      const user = req.user!;
      const ownerId = user.id; // For owners, id IS ownerId
      
      const distribution = await storage.getStatusDistribution(from, to, ownerId);
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch status distribution" });
    }
  });

  app.get("/api/analytics/export", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const type = req.query.type as string || 'revenue';
      const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = req.query.to ? new Date(req.query.to as string) : new Date();
      const user = req.user!;
      const ownerId = user.id; // For owners, id IS ownerId
      
      if (type === 'revenue') {
        const data = await storage.getRevenueSeries('day', from, to, ownerId);
        const csv = 'Date,Revenue\n' + data.map(d => `${d.label},${d.value}`).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="revenue-export.csv"');
        res.send(csv);
      } else if (type === 'staff') {
        const data = await storage.getStaffPerformance(from, to, ownerId);
        const csv = 'Staff Name,Bookings,Tasks Completed\n' + data.map(d => `${d.staffName},${d.bookingsCount},${d.tasksCompleted}`).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="staff-performance.csv"');
        res.send(csv);
      } else if (type === 'tasks') {
        const data = await storage.getStatusDistribution(from, to, ownerId);
        const csv = 'Status,Count\n' + data.map(d => `${d.status},${d.count}`).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.csv"');
        res.send(csv);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Approvals
  app.get("/api/approvals", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const approvals = await storage.getAllApprovals(req.user!.id);
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.post("/api/approvals", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertApprovalSchema.strict().parse({
        ...req.body,
        ownerId: req.user!.id
      });
      const approval = await storage.createApproval(data);
      res.json(approval);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create approval" });
    }
  });

  app.patch("/api/approvals/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertApprovalSchema.partial().strict().parse(req.body);
      const approval = await storage.updateApproval(req.params.id, data);
      if (!approval) {
        return res.status(404).json({ error: "Approval not found" });
      }
      res.json(approval);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update approval" });
    }
  });

  // AI Background Generator
  app.post("/api/ai/background", authMiddleware, async (req: AuthRequest, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'missing prompt' });
    }

    try {
      const leonardoApiKey = process.env.LEONARDO_API_KEY;

      if (!leonardoApiKey) {
        // Return a mock URL for development/testing
        const mockUrl = `https://images.unsplash.com/photo-1519167758481-83f29da8c4c0?w=1200&h=800&fit=crop&q=80`;
        return res.json({ 
          url: mockUrl,
          note: 'Using mock image. Add LEONARDO_API_KEY to environment for AI generation.' 
        });
      }

      // Leonardo API integration would go here
      // For now, return mock URL
      const mockUrl = `https://images.unsplash.com/photo-1519167758481-83f29da8c4c0?w=1200&h=800&fit=crop&q=80`;
      res.json({ url: mockUrl });
    } catch (error: any) {
      console.error('AI Background generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate background',
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
