import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertTaskSchema,
  insertMessageSchema,
  insertDeliverableSchema,
  loginSchema,
  signupSchema,
} from "@shared/schema";
import {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  type AuthRequest,
} from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      
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

      // Create user
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        role: data.role,
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
      const data = loginSchema.parse(req.body);

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
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const data = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, data);
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

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Staff
  app.get("/api/staff", async (req, res) => {
    try {
      const staff = await storage.getAllStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const staff = await storage.getStaff(req.params.id);
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
      
      const validatedData = insertStaffSchema.parse(data);
      const staff = await storage.createStaff(validatedData);
      res.json(staff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create staff" });
    }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const data = insertStaffSchema.partial().parse(req.body);
      const staff = await storage.updateStaff(req.params.id, data);
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
  app.get("/api/proposals", async (req, res) => {
    try {
      const proposals = await storage.getAllProposals();
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch proposals" });
    }
  });

  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const proposal = await storage.getProposal(req.params.id);
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
      const data = insertProposalSchema.parse(req.body);
      const proposal = await storage.createProposal(data);
      res.json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create proposal" });
    }
  });

  app.patch("/api/proposals/:id", async (req, res) => {
    try {
      const data = insertProposalSchema.partial().parse(req.body);
      const proposal = await storage.updateProposal(req.params.id, data);
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

  app.post("/api/proposals/:id/convert-to-booking", async (req, res) => {
    try {
      const booking = await storage.convertProposalToBooking(req.params.id);
      res.json(booking);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to convert proposal to booking" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
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
      const data = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(data);
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const data = insertBookingSchema.partial().parse(req.body);
      const booking = await storage.updateBooking(req.params.id, data);
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
      const data = insertBookingStaffSchema.parse({ ...req.body, bookingId: req.params.id });
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
  app.get("/api/invoices", authMiddleware, async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", authMiddleware, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
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
      const data = insertInvoiceSchema.parse(req.body);
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
  app.post("/api/bookings/:id/generate-invoice", authMiddleware, async (req, res) => {
    try {
      // Check if invoice already exists for this booking
      const existing = await storage.getInvoiceByBooking(req.params.id);
      if (existing) {
        return res.status(400).json({ error: "Invoice already exists for this booking" });
      }

      // Get booking details
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Generate invoice number (simple timestamp-based)
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create invoice with booking data
      const invoice = await storage.createInvoice({
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

  app.patch("/api/invoices/:id", authMiddleware, async (req, res) => {
    try {
      const data = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, data);
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
      const data = insertInvoiceItemSchema.parse({ ...req.body, invoiceId: req.params.id });
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
      const data = insertPaymentSchema.parse(req.body);
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
  app.get("/api/payment-settings", async (req, res) => {
    try {
      const settings = await storage.getAllPaymentSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment settings" });
    }
  });

  app.post("/api/payment-settings", async (req, res) => {
    try {
      const data = insertPaymentSettingsSchema.parse(req.body);
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
  app.get("/api/payment-methods", async (req, res) => {
    try {
      const methods = await storage.getAllPaymentMethods();
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
  app.get("/api/payment-plans", async (req, res) => {
    try {
      const plans = await storage.getAllPaymentPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment plans" });
    }
  });

  app.post("/api/payment-plans", async (req, res) => {
    try {
      const data = insertPaymentPlanSchema.parse(req.body);
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
      const data = insertBookingEngineSettingsSchema.parse(req.body);
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
  app.get("/api/booking-questions", async (req, res) => {
    try {
      const questions = await storage.getAllBookingQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking questions" });
    }
  });

  app.post("/api/booking-questions", async (req, res) => {
    try {
      const data = insertBookingQuestionSchema.parse(req.body);
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
  app.get("/api/unavailable-notices", async (req, res) => {
    try {
      const notices = await storage.getAllUnavailableNotices();
      res.json(notices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unavailable notices" });
    }
  });

  app.post("/api/unavailable-notices", async (req, res) => {
    try {
      const data = insertUnavailableNoticeSchema.parse(req.body);
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
      const data = insertPrivacySettingsSchema.parse(req.body);
      const settings = await storage.upsertPrivacySettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save privacy settings" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
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

  app.post("/api/tasks", async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const data = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
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
      const data = insertMessageSchema.parse(req.body);
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
      const data = insertDeliverableSchema.parse({
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

  const httpServer = createServer(app);
  return httpServer;
}
