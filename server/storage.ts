import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import type {
  User, InsertUser,
  Client, InsertClient,
  Staff, InsertStaff,
  Proposal, InsertProposal,
  Booking, InsertBooking,
  BookingStaff, InsertBookingStaff,
  Invoice, InsertInvoice,
  InvoiceItem, InsertInvoiceItem,
  Payment, InsertPayment,
  PaymentSettings, InsertPaymentSettings,
  PaymentPlan, InsertPaymentPlan,
  PaymentMethod, InsertPaymentMethod,
  BookingEngineSettings, InsertBookingEngineSettings,
  BookingQuestion, InsertBookingQuestion,
  BookingResponse, InsertBookingResponse,
  UnavailableNotice, InsertUnavailableNotice,
  PrivacySettings, InsertPrivacySettings,
  Task, InsertTask,
  Message, InsertMessage,
  Deliverable, InsertDeliverable,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Clients
  getAllClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // Staff
  getAllStaff(): Promise<Staff[]>;
  getStaff(id: string): Promise<Staff | undefined>;
  getStaffByUserId(userId: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  
  // Proposals
  getAllProposals(): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | undefined>;
  getProposalsByClient(clientId: string): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;
  convertProposalToBooking(proposalId: string): Promise<Booking>;
  
  // Bookings
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByClient(clientId: string): Promise<Booking[]>;
  getUpcomingBookings(limit?: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  
  // Booking Staff Assignments
  getBookingStaff(bookingId: string): Promise<BookingStaff[]>;
  assignStaffToBooking(assignment: InsertBookingStaff): Promise<BookingStaff>;
  removeStaffFromBooking(id: string): Promise<boolean>;
  
  // Invoices
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByBooking(bookingId: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  
  // Invoice Items
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItem(id: string): Promise<boolean>;
  
  // Payments
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Payment Settings
  getAllPaymentSettings(): Promise<PaymentSettings[]>;
  getPaymentSettings(processor: string): Promise<PaymentSettings | undefined>;
  upsertPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings>;
  
  // Payment Methods
  getAllPaymentMethods(): Promise<PaymentMethod[]>;
  updatePaymentMethod(id: string, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  
  // Payment Plans
  getAllPaymentPlans(): Promise<PaymentPlan[]>;
  createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan>;
  
  // Booking Engine Settings
  getBookingEngineSettings(): Promise<BookingEngineSettings | undefined>;
  upsertBookingEngineSettings(settings: InsertBookingEngineSettings): Promise<BookingEngineSettings>;
  
  // Booking Questions
  getAllBookingQuestions(): Promise<BookingQuestion[]>;
  createBookingQuestion(question: InsertBookingQuestion): Promise<BookingQuestion>;
  updateBookingQuestion(id: string, question: Partial<InsertBookingQuestion>): Promise<BookingQuestion | undefined>;
  
  // Booking Responses
  getBookingResponses(bookingId: string): Promise<BookingResponse[]>;
  createBookingResponse(response: InsertBookingResponse): Promise<BookingResponse>;
  
  // Unavailable Notices
  getAllUnavailableNotices(): Promise<UnavailableNotice[]>;
  createUnavailableNotice(notice: InsertUnavailableNotice): Promise<UnavailableNotice>;
  updateUnavailableNotice(id: string, notice: Partial<InsertUnavailableNotice>): Promise<UnavailableNotice | undefined>;
  
  // Privacy Settings
  getPrivacySettings(): Promise<PrivacySettings | undefined>;
  upsertPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings>;
  
  // Tasks
  getAllTasks(): Promise<Task[]>;
  getTasksByBooking(bookingId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  
  // Messages
  getMessagesByBooking(bookingId: string): Promise<Message[]>;
  getMessagesByAudience(audience: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  
  // Deliverables
  getDeliverablesByBooking(bookingId: string): Promise<Deliverable[]>;
  createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable>;
  deleteDeliverable(id: string): Promise<boolean>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalRevenue: number;
    activeProposals: number;
    upcomingBookings: number;
    pendingTasks: number;
  }>;
  getRevenueByMonth(): Promise<Array<{ month: string; revenue: number }>>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set(userData).where(eq(schema.users.id, id)).returning();
    return user;
  }

  // Clients
  async getAllClients(): Promise<Client[]> {
    return db.select().from(schema.clients).orderBy(desc(schema.clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(schema.clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db.update(schema.clients).set(clientData).where(eq(schema.clients.id, id)).returning();
    return client;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(schema.clients).where(eq(schema.clients.id, id));
    return true;
  }

  // Staff
  async getAllStaff(): Promise<Staff[]> {
    return db.select().from(schema.staff).orderBy(desc(schema.staff.createdAt));
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const [staff] = await db.select().from(schema.staff).where(eq(schema.staff.id, id));
    return staff;
  }

  async getStaffByUserId(userId: string): Promise<Staff | undefined> {
    const [staff] = await db.select().from(schema.staff).where(eq(schema.staff.userId, userId));
    return staff;
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [staff] = await db.insert(schema.staff).values(insertStaff).returning();
    return staff;
  }

  async updateStaff(id: string, staffData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [staff] = await db.update(schema.staff).set(staffData).where(eq(schema.staff.id, id)).returning();
    return staff;
  }

  // Proposals
  async getAllProposals(): Promise<Proposal[]> {
    return db.select().from(schema.proposals).orderBy(desc(schema.proposals.createdAt));
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(schema.proposals).where(eq(schema.proposals.id, id));
    return proposal;
  }

  async getProposalsByClient(clientId: string): Promise<Proposal[]> {
    return db.select().from(schema.proposals).where(eq(schema.proposals.clientId, clientId));
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db.insert(schema.proposals).values(insertProposal).returning();
    return proposal;
  }

  async updateProposal(id: string, proposalData: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const [proposal] = await db.update(schema.proposals).set(proposalData).where(eq(schema.proposals.id, id)).returning();
    return proposal;
  }

  async convertProposalToBooking(proposalId: string): Promise<Booking> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }
    
    if (proposal.status !== "accepted") {
      throw new Error("Only accepted proposals can be converted to bookings");
    }

    const existingBooking = await db.select().from(schema.bookings).where(eq(schema.bookings.proposalId, proposalId)).limit(1);
    if (existingBooking.length > 0) {
      throw new Error("Booking already exists for this proposal");
    }

    const booking: InsertBooking = {
      clientId: proposal.clientId,
      proposalId: proposal.id,
      title: proposal.title,
      eventType: "event",
      status: "confirmed",
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
      venueName: "",
      venueAddress: "",
      packageTotal: proposal.amount,
      balanceDue: proposal.amount,
    };

    return this.createBooking(booking);
  }

  // Bookings
  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(schema.bookings).orderBy(desc(schema.bookings.startTime));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
    return booking;
  }

  async getBookingsByClient(clientId: string): Promise<Booking[]> {
    return db.select().from(schema.bookings).where(eq(schema.bookings.clientId, clientId));
  }

  async getUpcomingBookings(limit: number = 5): Promise<Booking[]> {
    return db.select().from(schema.bookings)
      .where(eq(schema.bookings.status, "confirmed"))
      .orderBy(schema.bookings.startTime)
      .limit(limit);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(schema.bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBooking(id: string, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db.update(schema.bookings).set(bookingData).where(eq(schema.bookings.id, id)).returning();
    return booking;
  }

  // Booking Staff Assignments
  async getBookingStaff(bookingId: string): Promise<BookingStaff[]> {
    return db.select().from(schema.bookingStaff).where(eq(schema.bookingStaff.bookingId, bookingId));
  }

  async assignStaffToBooking(assignment: InsertBookingStaff): Promise<BookingStaff> {
    const [result] = await db.insert(schema.bookingStaff).values(assignment).returning();
    return result;
  }

  async removeStaffFromBooking(id: string): Promise<boolean> {
    await db.delete(schema.bookingStaff).where(eq(schema.bookingStaff.id, id));
    return true;
  }

  // Invoices
  async getAllInvoices(): Promise<Invoice[]> {
    return db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
    return invoice;
  }

  async getInvoiceByBooking(bookingId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.bookingId, bookingId));
    return invoice;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(schema.invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db.update(schema.invoices).set(invoiceData).where(eq(schema.invoices.id, id)).returning();
    return invoice;
  }

  // Invoice Items
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [result] = await db.insert(schema.invoiceItems).values(item).returning();
    return result;
  }

  async deleteInvoiceItem(id: string): Promise<boolean> {
    await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.id, id));
    return true;
  }

  // Payments
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return db.select().from(schema.payments).where(eq(schema.payments.invoiceId, invoiceId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [result] = await db.insert(schema.payments).values(payment).returning();
    return result;
  }

  // Payment Settings
  async getAllPaymentSettings(): Promise<PaymentSettings[]> {
    return db.select().from(schema.paymentSettings);
  }

  async getPaymentSettings(processor: string): Promise<PaymentSettings | undefined> {
    const [settings] = await db.select().from(schema.paymentSettings).where(eq(schema.paymentSettings.processor, processor));
    return settings;
  }

  async upsertPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings> {
    const [result] = await db.insert(schema.paymentSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: schema.paymentSettings.processor,
        set: settings
      })
      .returning();
    return result;
  }

  // Payment Methods
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return db.select().from(schema.paymentMethods).orderBy(schema.paymentMethods.sortOrder);
  }

  async updatePaymentMethod(id: string, methodData: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const [method] = await db.update(schema.paymentMethods).set(methodData).where(eq(schema.paymentMethods.id, id)).returning();
    return method;
  }

  // Payment Plans
  async getAllPaymentPlans(): Promise<PaymentPlan[]> {
    return db.select().from(schema.paymentPlans);
  }

  async createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan> {
    const [result] = await db.insert(schema.paymentPlans).values(plan).returning();
    return result;
  }

  // Booking Engine Settings
  async getBookingEngineSettings(): Promise<BookingEngineSettings | undefined> {
    const [settings] = await db.select().from(schema.bookingEngineSettings).limit(1);
    return settings;
  }

  async upsertBookingEngineSettings(settings: InsertBookingEngineSettings): Promise<BookingEngineSettings> {
    const existing = await this.getBookingEngineSettings();
    if (existing) {
      const [result] = await db.update(schema.bookingEngineSettings)
        .set(settings)
        .where(eq(schema.bookingEngineSettings.id, existing.id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(schema.bookingEngineSettings).values(settings).returning();
      return result;
    }
  }

  // Booking Questions
  async getAllBookingQuestions(): Promise<BookingQuestion[]> {
    return db.select().from(schema.bookingQuestions).orderBy(schema.bookingQuestions.sortOrder);
  }

  async createBookingQuestion(question: InsertBookingQuestion): Promise<BookingQuestion> {
    const [result] = await db.insert(schema.bookingQuestions).values(question).returning();
    return result;
  }

  async updateBookingQuestion(id: string, questionData: Partial<InsertBookingQuestion>): Promise<BookingQuestion | undefined> {
    const [question] = await db.update(schema.bookingQuestions).set(questionData).where(eq(schema.bookingQuestions.id, id)).returning();
    return question;
  }

  // Booking Responses
  async getBookingResponses(bookingId: string): Promise<BookingResponse[]> {
    return db.select().from(schema.bookingResponses).where(eq(schema.bookingResponses.bookingId, bookingId));
  }

  async createBookingResponse(response: InsertBookingResponse): Promise<BookingResponse> {
    const [result] = await db.insert(schema.bookingResponses).values(response).returning();
    return result;
  }

  // Unavailable Notices
  async getAllUnavailableNotices(): Promise<UnavailableNotice[]> {
    return db.select().from(schema.unavailableNotices).orderBy(desc(schema.unavailableNotices.startDate));
  }

  async createUnavailableNotice(notice: InsertUnavailableNotice): Promise<UnavailableNotice> {
    const [result] = await db.insert(schema.unavailableNotices).values(notice).returning();
    return result;
  }

  async updateUnavailableNotice(id: string, noticeData: Partial<InsertUnavailableNotice>): Promise<UnavailableNotice | undefined> {
    const [notice] = await db.update(schema.unavailableNotices).set(noticeData).where(eq(schema.unavailableNotices.id, id)).returning();
    return notice;
  }

  // Privacy Settings
  async getPrivacySettings(): Promise<PrivacySettings | undefined> {
    const [settings] = await db.select().from(schema.privacySettings).limit(1);
    return settings;
  }

  async upsertPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings> {
    const existing = await this.getPrivacySettings();
    if (existing) {
      const [result] = await db.update(schema.privacySettings)
        .set(settings)
        .where(eq(schema.privacySettings.id, existing.id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(schema.privacySettings).values(settings).returning();
      return result;
    }
  }

  // Tasks
  async getAllTasks(): Promise<Task[]> {
    return db.select().from(schema.tasks).orderBy(desc(schema.tasks.createdAt));
  }

  async getTasksByBooking(bookingId: string): Promise<Task[]> {
    return db.select().from(schema.tasks).where(eq(schema.tasks.bookingId, bookingId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [result] = await db.insert(schema.tasks).values(task).returning();
    return result;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(schema.tasks).set(taskData).where(eq(schema.tasks.id, id)).returning();
    return task;
  }

  // Messages
  async getMessagesByBooking(bookingId: string): Promise<Message[]> {
    return db.select().from(schema.messages).where(eq(schema.messages.bookingId, bookingId)).orderBy(schema.messages.createdAt);
  }

  async getMessagesByAudience(audience: string): Promise<Message[]> {
    return db.select().from(schema.messages).where(eq(schema.messages.audience, audience)).orderBy(desc(schema.messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(schema.messages).values(message).returning();
    return result;
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const [message] = await db.update(schema.messages).set({ isRead: true }).where(eq(schema.messages.id, id)).returning();
    return message;
  }

  // Deliverables
  async getDeliverablesByBooking(bookingId: string): Promise<Deliverable[]> {
    return db.select().from(schema.deliverables).where(eq(schema.deliverables.bookingId, bookingId)).orderBy(desc(schema.deliverables.createdAt));
  }

  async createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable> {
    const [result] = await db.insert(schema.deliverables).values(deliverable).returning();
    return result;
  }

  async deleteDeliverable(id: string): Promise<boolean> {
    const result = await db.delete(schema.deliverables).where(eq(schema.deliverables.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    activeProposals: number;
    upcomingBookings: number;
    pendingTasks: number;
  }> {
    const invoices = await db.select().from(schema.invoices);
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
    
    const activeProposals = await db.select().from(schema.proposals)
      .where(eq(schema.proposals.status, "viewed"));
    
    const upcomingBookings = await db.select().from(schema.bookings)
      .where(eq(schema.bookings.status, "confirmed"));
    
    const pendingTasks = await db.select().from(schema.tasks)
      .where(eq(schema.tasks.status, "todo"));

    return {
      totalRevenue,
      activeProposals: activeProposals.length,
      upcomingBookings: upcomingBookings.length,
      pendingTasks: pendingTasks.length,
    };
  }

  async getRevenueByMonth(): Promise<Array<{ month: string; revenue: number }>> {
    const payments = await db.select().from(schema.payments);
    const revenueByMonth: { [key: string]: number } = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.paidAt);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(payment.amount);
    });

    return Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue
    }));
  }
}

export const storage = new DatabaseStorage();
