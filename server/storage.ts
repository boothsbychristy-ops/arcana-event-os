import { eq, and, desc, gte, lte, or, isNotNull } from "drizzle-orm";
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
  Board, InsertBoard,
  BoardGroup, InsertBoardGroup,
  TaskStatus, InsertTaskStatus,
  Task, InsertTask,
  TaskComment, InsertTaskComment,
  TaskAttachment, InsertTaskAttachment,
  Subtask, InsertSubtask,
  TaskActivity, InsertTaskActivity,
  BoardMember, InsertBoardMember,
  Message, InsertMessage,
  Deliverable, InsertDeliverable,
  Lead, InsertLead,
  StaffApplication, InsertStaffApplication,
  Automation, InsertAutomation,
  AutomationLog, InsertAutomationLog,
  Approval, InsertApproval,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Clients
  getAllClients(ownerId: string): Promise<Client[]>;
  getClient(id: string, ownerId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, ownerId: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string, ownerId: string): Promise<boolean>;
  
  // Staff
  getAllStaff(ownerId: string): Promise<Staff[]>;
  getStaff(id: string, ownerId: string): Promise<Staff | undefined>;
  getStaffByUserId(userId: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, ownerId: string, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  
  // Proposals
  getAllProposals(ownerId: string): Promise<Proposal[]>;
  getProposal(id: string, ownerId: string): Promise<Proposal | undefined>;
  getProposalsByClient(clientId: string): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, ownerId: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;
  convertProposalToBooking(proposalId: string, ownerId: string): Promise<Booking>;
  
  // Bookings
  getAllBookings(ownerId: string): Promise<Booking[]>;
  getBooking(id: string, ownerId: string): Promise<Booking | undefined>;
  getBookingsByClient(clientId: string): Promise<Booking[]>;
  getUpcomingBookings(limit?: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, ownerId: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  
  // Booking Staff Assignments
  getBookingStaff(bookingId: string): Promise<BookingStaff[]>;
  assignStaffToBooking(assignment: InsertBookingStaff): Promise<BookingStaff>;
  removeStaffFromBooking(id: string): Promise<boolean>;
  
  // Invoices
  getAllInvoices(ownerId: string): Promise<Invoice[]>;
  getInvoice(id: string, ownerId: string): Promise<Invoice | undefined>;
  getInvoiceByBooking(bookingId: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, ownerId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  
  // Invoice Items
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItem(id: string): Promise<boolean>;
  
  // Payments
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Payment Settings
  getAllPaymentSettings(ownerId: string): Promise<PaymentSettings[]>;
  getPaymentSettings(processor: string): Promise<PaymentSettings | undefined>;
  upsertPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings>;
  
  // Payment Methods
  getAllPaymentMethods(ownerId: string): Promise<PaymentMethod[]>;
  updatePaymentMethod(id: string, method: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  
  // Payment Plans
  getAllPaymentPlans(ownerId: string): Promise<PaymentPlan[]>;
  createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan>;
  
  // Booking Engine Settings
  getBookingEngineSettings(): Promise<BookingEngineSettings | undefined>;
  upsertBookingEngineSettings(settings: InsertBookingEngineSettings): Promise<BookingEngineSettings>;
  
  // Booking Questions
  getAllBookingQuestions(ownerId: string): Promise<BookingQuestion[]>;
  createBookingQuestion(question: InsertBookingQuestion): Promise<BookingQuestion>;
  updateBookingQuestion(id: string, question: Partial<InsertBookingQuestion>): Promise<BookingQuestion | undefined>;
  
  // Booking Responses
  getBookingResponses(bookingId: string): Promise<BookingResponse[]>;
  createBookingResponse(response: InsertBookingResponse): Promise<BookingResponse>;
  
  // Unavailable Notices
  getAllUnavailableNotices(ownerId: string): Promise<UnavailableNotice[]>;
  createUnavailableNotice(notice: InsertUnavailableNotice): Promise<UnavailableNotice>;
  updateUnavailableNotice(id: string, notice: Partial<InsertUnavailableNotice>): Promise<UnavailableNotice | undefined>;
  
  // Privacy Settings
  getPrivacySettings(): Promise<PrivacySettings | undefined>;
  upsertPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings>;
  
  // Boards
  getAllBoards(ownerId: string): Promise<Board[]>;
  getBoard(id: string, ownerId: string): Promise<Board | undefined>;
  getBoardWithDetails(id: string, ownerId: string): Promise<{ board: Board; groups: BoardGroup[]; tasks: Task[]; statuses: TaskStatus[] } | undefined>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, ownerId: string, board: Partial<InsertBoard>): Promise<Board | undefined>;
  deleteBoard(id: string, ownerId: string): Promise<boolean>;
  
  // Board Groups
  getBoardGroups(boardId: string): Promise<BoardGroup[]>;
  createBoardGroup(group: InsertBoardGroup): Promise<BoardGroup>;
  updateBoardGroup(id: string, group: Partial<InsertBoardGroup>): Promise<BoardGroup | undefined>;
  deleteBoardGroup(id: string): Promise<boolean>;
  
  // Task Statuses
  getTaskStatuses(boardId: string): Promise<TaskStatus[]>;
  createTaskStatus(status: InsertTaskStatus): Promise<TaskStatus>;
  deleteTaskStatus(id: string): Promise<boolean>;
  
  // Tasks
  getAllTasks(ownerId: string): Promise<Task[]>;
  getTasksByBooking(bookingId: string): Promise<Task[]>;
  getTasksByBoard(boardId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getCalendarTasks(filters: { ownerId: string; from: Date; to: Date; assigneeId?: string; clientId?: string; status?: string; priority?: string }): Promise<any[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  moveTask(id: string, toGroupId: string, toIndex: number): Promise<Task | undefined>;
  
  // Task Comments
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  updateTaskComment(id: string, comment: Partial<InsertTaskComment>): Promise<TaskComment | undefined>;
  deleteTaskComment(id: string): Promise<boolean>;
  
  // Task Attachments
  getTaskAttachments(taskId: string): Promise<TaskAttachment[]>;
  createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment>;
  deleteTaskAttachment(id: string): Promise<boolean>;
  
  // Subtasks
  getSubtasks(taskId: string): Promise<Subtask[]>;
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  updateSubtask(id: string, subtask: Partial<InsertSubtask>): Promise<Subtask | undefined>;
  deleteSubtask(id: string): Promise<boolean>;
  
  // Task Activity
  getTaskActivity(taskId: string): Promise<TaskActivity[]>;
  createTaskActivity(activity: InsertTaskActivity): Promise<TaskActivity>;
  
  // Board Members
  getBoardMembers(boardId: string): Promise<BoardMember[]>;
  addBoardMember(member: InsertBoardMember): Promise<BoardMember>;
  updateBoardMember(id: string, member: Partial<InsertBoardMember>): Promise<BoardMember | undefined>;
  removeBoardMember(id: string): Promise<boolean>;
  
  // Messages
  getMessagesByBooking(bookingId: string): Promise<Message[]>;
  getMessagesByAudience(audience: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  
  // Deliverables
  getDeliverablesByBooking(bookingId: string): Promise<Deliverable[]>;
  createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable>;
  deleteDeliverable(id: string): Promise<boolean>;
  
  // Leads
  getAllLeads(ownerId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, leadData: Partial<InsertLead>): Promise<Lead | undefined>;
  convertLeadToClient(leadId: string): Promise<{ client: Client; proposal: Proposal }>;
  
  // Staff Applications
  getAllStaffApplications(ownerId: string): Promise<StaffApplication[]>;
  getStaffApplication(id: string): Promise<StaffApplication | undefined>;
  createStaffApplication(application: InsertStaffApplication): Promise<StaffApplication>;
  updateStaffApplication(id: string, status: string): Promise<StaffApplication | undefined>;
  approveStaffApplication(id: string): Promise<{ application: StaffApplication; staff: Staff; user: User; temporaryPassword: string }>;
  rejectStaffApplication(id: string): Promise<StaffApplication | undefined>;
  
  // Automations
  getAllAutomations(ownerId: string): Promise<Automation[]>;
  getAutomation(id: string): Promise<Automation | undefined>;
  createAutomation(automation: InsertAutomation): Promise<Automation>;
  updateAutomation(id: string, automation: Partial<InsertAutomation>): Promise<Automation | undefined>;
  toggleAutomation(id: string): Promise<Automation | undefined>;
  deleteAutomation(id: string): Promise<boolean>;
  
  // Automation Logs
  getAutomationLogs(automationId?: string, limit?: number): Promise<AutomationLog[]>;
  
  // Approvals
  getAllApprovals(ownerId: string): Promise<Approval[]>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  updateApproval(id: string, approval: Partial<InsertApproval>): Promise<Approval | undefined>;
  
  // Analytics
  getAnalyticsSummary(from: Date, to: Date, ownerId: string, staffId?: string): Promise<{
    revenue: number;
    bookings: number;
    avgBookingValue: number;
    conversionRate: number;
    taskCompletion: number;
    staffUtilization: number;
  }>;
  getRevenueSeries(interval: 'day' | 'week' | 'month', from: Date, to: Date, ownerId: string): Promise<Array<{ label: string; value: number }>>;
  getStaffPerformance(from: Date, to: Date, ownerId: string): Promise<Array<{ staffId: string; staffName: string; bookingsCount: number; tasksCompleted: number }>>;
  getStatusDistribution(from: Date, to: Date, ownerId: string): Promise<Array<{ status: string; count: number }>>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalRevenue: number;
    activeProposals: number;
    upcomingBookings: number;
    pendingTasks: number;
    noStaffAssigned: number;
    unpaidInvoices: number;
    openDeliverables: number;
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
  async getAllClients(ownerId: string): Promise<Client[]> {
    return db.select().from(schema.clients)
      .where(eq(schema.clients.ownerId, ownerId))
      .orderBy(desc(schema.clients.createdAt));
  }

  async getClient(id: string, ownerId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(schema.clients)
      .where(and(eq(schema.clients.id, id), eq(schema.clients.ownerId, ownerId)));
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(schema.clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: string, ownerId: string, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db.update(schema.clients).set(clientData)
      .where(and(eq(schema.clients.id, id), eq(schema.clients.ownerId, ownerId))).returning();
    return client;
  }

  async deleteClient(id: string, ownerId: string): Promise<boolean> {
    await db.delete(schema.clients).where(and(eq(schema.clients.id, id), eq(schema.clients.ownerId, ownerId)));
    return true;
  }

  // Staff
  async getAllStaff(ownerId: string): Promise<Staff[]> {
    return db.select().from(schema.staff)
      .where(eq(schema.staff.ownerId, ownerId))
      .orderBy(desc(schema.staff.createdAt));
  }

  async getStaff(id: string, ownerId: string): Promise<Staff | undefined> {
    const [staff] = await db.select().from(schema.staff)
      .where(and(eq(schema.staff.id, id), eq(schema.staff.ownerId, ownerId)));
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

  async updateStaff(id: string, ownerId: string, staffData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [staff] = await db.update(schema.staff).set(staffData)
      .where(and(eq(schema.staff.id, id), eq(schema.staff.ownerId, ownerId))).returning();
    return staff;
  }

  // Proposals
  async getAllProposals(ownerId: string): Promise<Proposal[]> {
    return db.select().from(schema.proposals)
      .where(eq(schema.proposals.ownerId, ownerId))
      .orderBy(desc(schema.proposals.createdAt));
  }

  async getProposal(id: string, ownerId: string): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(schema.proposals)
      .where(and(eq(schema.proposals.id, id), eq(schema.proposals.ownerId, ownerId)));
    return proposal;
  }

  async getProposalsByClient(clientId: string): Promise<Proposal[]> {
    return db.select().from(schema.proposals).where(eq(schema.proposals.clientId, clientId));
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db.insert(schema.proposals).values(insertProposal).returning();
    return proposal;
  }

  async updateProposal(id: string, ownerId: string, proposalData: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const [proposal] = await db.update(schema.proposals).set(proposalData)
      .where(and(eq(schema.proposals.id, id), eq(schema.proposals.ownerId, ownerId))).returning();
    return proposal;
  }

  async convertProposalToBooking(proposalId: string, ownerId: string): Promise<Booking> {
    const proposal = await this.getProposal(proposalId, ownerId);
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
      ownerId: proposal.ownerId,
      clientId: proposal.clientId,
      proposalId: proposal.id,
      title: proposal.title,
      eventType: "event",
      status: "confirmed",
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
      notes: `Converted from proposal: ${proposal.description || ''}`,
    };

    return this.createBooking(booking);
  }

  // Bookings
  async getAllBookings(ownerId: string): Promise<Booking[]> {
    return db.select().from(schema.bookings)
      .where(eq(schema.bookings.ownerId, ownerId))
      .orderBy(desc(schema.bookings.startTime));
  }

  async getBooking(id: string, ownerId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(schema.bookings)
      .where(and(eq(schema.bookings.id, id), eq(schema.bookings.ownerId, ownerId)));
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

  async updateBooking(id: string, ownerId: string, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db.update(schema.bookings).set(bookingData)
      .where(and(eq(schema.bookings.id, id), eq(schema.bookings.ownerId, ownerId))).returning();
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
  async getAllInvoices(ownerId: string): Promise<Invoice[]> {
    return db.select().from(schema.invoices)
      .where(eq(schema.invoices.ownerId, ownerId))
      .orderBy(desc(schema.invoices.createdAt));
  }

  async getInvoice(id: string, ownerId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(schema.invoices)
      .where(and(eq(schema.invoices.id, id), eq(schema.invoices.ownerId, ownerId)));
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

  async updateInvoice(id: string, ownerId: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db.update(schema.invoices).set(invoiceData)
      .where(and(eq(schema.invoices.id, id), eq(schema.invoices.ownerId, ownerId))).returning();
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
  async getAllPaymentSettings(ownerId: string): Promise<PaymentSettings[]> {
    return db.select().from(schema.paymentSettings)
      .where(eq(schema.paymentSettings.ownerId, ownerId));
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
  async getAllPaymentMethods(ownerId: string): Promise<PaymentMethod[]> {
    return db.select().from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.ownerId, ownerId))
      .orderBy(schema.paymentMethods.sortOrder);
  }

  async updatePaymentMethod(id: string, methodData: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const [method] = await db.update(schema.paymentMethods).set(methodData).where(eq(schema.paymentMethods.id, id)).returning();
    return method;
  }

  // Payment Plans
  async getAllPaymentPlans(ownerId: string): Promise<PaymentPlan[]> {
    return db.select().from(schema.paymentPlans)
      .where(eq(schema.paymentPlans.ownerId, ownerId));
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
  async getAllBookingQuestions(ownerId: string): Promise<BookingQuestion[]> {
    return db.select().from(schema.bookingQuestions)
      .where(eq(schema.bookingQuestions.ownerId, ownerId))
      .orderBy(schema.bookingQuestions.sortOrder);
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
  async getAllUnavailableNotices(ownerId: string): Promise<UnavailableNotice[]> {
    return db.select().from(schema.unavailableNotices)
      .where(eq(schema.unavailableNotices.ownerId, ownerId))
      .orderBy(desc(schema.unavailableNotices.startDate));
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

  // Boards
  async getAllBoards(ownerId: string): Promise<Board[]> {
    return db.select().from(schema.boards).where(eq(schema.boards.ownerId, ownerId)).orderBy(desc(schema.boards.createdAt));
  }

  async getBoard(id: string, ownerId: string): Promise<Board | undefined> {
    const [board] = await db.select().from(schema.boards)
      .where(and(eq(schema.boards.id, id), eq(schema.boards.ownerId, ownerId)));
    return board;
  }

  async getBoardWithDetails(id: string, ownerId: string): Promise<{ board: Board; groups: BoardGroup[]; tasks: Task[]; statuses: TaskStatus[] } | undefined> {
    const board = await this.getBoard(id, ownerId);
    if (!board) return undefined;

    const groups = await this.getBoardGroups(id);
    const tasks = await this.getTasksByBoard(id);
    const statuses = await this.getTaskStatuses(id);

    return { board, groups, tasks, statuses };
  }

  async createBoard(board: InsertBoard): Promise<Board> {
    const [result] = await db.insert(schema.boards).values(board).returning();
    return result;
  }

  async updateBoard(id: string, ownerId: string, boardData: Partial<InsertBoard>): Promise<Board | undefined> {
    const [board] = await db.update(schema.boards).set(boardData)
      .where(and(eq(schema.boards.id, id), eq(schema.boards.ownerId, ownerId))).returning();
    return board;
  }

  async deleteBoard(id: string, ownerId: string): Promise<boolean> {
    const result = await db.delete(schema.boards).where(and(eq(schema.boards.id, id), eq(schema.boards.ownerId, ownerId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Board Groups
  async getBoardGroups(boardId: string): Promise<BoardGroup[]> {
    return db.select().from(schema.boardGroups).where(eq(schema.boardGroups.boardId, boardId)).orderBy(schema.boardGroups.sortIndex);
  }

  async createBoardGroup(group: InsertBoardGroup): Promise<BoardGroup> {
    const [result] = await db.insert(schema.boardGroups).values(group).returning();
    return result;
  }

  async updateBoardGroup(id: string, groupData: Partial<InsertBoardGroup>): Promise<BoardGroup | undefined> {
    const [group] = await db.update(schema.boardGroups).set(groupData).where(eq(schema.boardGroups.id, id)).returning();
    return group;
  }

  async deleteBoardGroup(id: string): Promise<boolean> {
    const result = await db.delete(schema.boardGroups).where(eq(schema.boardGroups.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Task Statuses
  async getTaskStatuses(boardId: string): Promise<TaskStatus[]> {
    return db.select().from(schema.taskStatuses).where(eq(schema.taskStatuses.boardId, boardId)).orderBy(schema.taskStatuses.sortIndex);
  }

  async createTaskStatus(status: InsertTaskStatus): Promise<TaskStatus> {
    const [result] = await db.insert(schema.taskStatuses).values(status).returning();
    return result;
  }

  async deleteTaskStatus(id: string): Promise<boolean> {
    const result = await db.delete(schema.taskStatuses).where(eq(schema.taskStatuses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Tasks
  async getAllTasks(ownerId: string): Promise<Task[]> {
    return db.select().from(schema.tasks)
      .where(eq(schema.tasks.ownerId, ownerId))
      .orderBy(desc(schema.tasks.createdAt));
  }

  async getTasksByBooking(bookingId: string): Promise<Task[]> {
    return db.select().from(schema.tasks).where(eq(schema.tasks.bookingId, bookingId));
  }

  async getTasksByBoard(boardId: string): Promise<Task[]> {
    return db.select().from(schema.tasks).where(eq(schema.tasks.boardId, boardId)).orderBy(schema.tasks.sortIndex);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    return task;
  }

  async getCalendarTasks(filters: { ownerId: string; from: Date; to: Date; assigneeId?: string; clientId?: string; status?: string; priority?: string }): Promise<any[]> {
    const conditions = [
      eq(schema.tasks.ownerId, filters.ownerId),
      isNotNull(schema.tasks.dueAt),
      gte(schema.tasks.dueAt, filters.from),
      lte(schema.tasks.dueAt, filters.to),
    ];

    if (filters.assigneeId) {
      conditions.push(eq(schema.tasks.assignedTo, filters.assigneeId));
    }
    if (filters.clientId) {
      conditions.push(eq(schema.tasks.linkedClientId, filters.clientId));
    }
    if (filters.status) {
      conditions.push(eq(schema.tasks.status, filters.status));
    }
    if (filters.priority) {
      conditions.push(eq(schema.tasks.priority, filters.priority));
    }

    const tasks = await db
      .select({
        id: schema.tasks.id,
        title: schema.tasks.title,
        dueAt: schema.tasks.dueAt,
        status: schema.tasks.status,
        priority: schema.tasks.priority,
        assignedTo: schema.tasks.assignedTo,
        linkedClientId: schema.tasks.linkedClientId,
        linkedBookingId: schema.tasks.linkedBookingId,
      })
      .from(schema.tasks)
      .where(and(...conditions))
      .orderBy(schema.tasks.dueAt);

    // Enrich with user, client, and booking data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const assignee = task.assignedTo
          ? await db.select({ id: schema.users.id, fullName: schema.users.fullName, avatarUrl: schema.users.avatarUrl })
              .from(schema.users)
              .where(eq(schema.users.id, task.assignedTo))
              .then(([user]) => user)
          : null;

        const client = task.linkedClientId
          ? await db.select({ id: schema.clients.id, fullName: schema.clients.fullName })
              .from(schema.clients)
              .where(eq(schema.clients.id, task.linkedClientId))
              .then(([c]) => c)
          : null;

        const booking = task.linkedBookingId
          ? await db.select({ id: schema.bookings.id, eventType: schema.bookings.eventType, startTime: schema.bookings.startTime })
              .from(schema.bookings)
              .where(eq(schema.bookings.id, task.linkedBookingId))
              .then(([b]) => b)
          : null;

        return {
          id: task.id,
          title: task.title,
          start: task.dueAt?.toISOString(),
          end: task.dueAt?.toISOString(), // Same as start for now
          allDay: false,
          status: task.status,
          priority: task.priority,
          assignee: assignee ? { id: assignee.id, name: assignee.fullName, avatar_url: assignee.avatarUrl } : null,
          client: client ? { id: client.id, name: client.fullName } : null,
          booking: booking ? { id: booking.id, title: booking.eventType || '', date: booking.startTime?.toISOString() } : null,
        };
      })
    );

    return enrichedTasks;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [result] = await db.insert(schema.tasks).values(task).returning();
    return result;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(schema.tasks).set(taskData).where(eq(schema.tasks.id, id)).returning();
    return task;
  }

  async moveTask(id: string, toGroupId: string, toIndex: number): Promise<Task | undefined> {
    const [task] = await db.update(schema.tasks)
      .set({ groupId: toGroupId, sortIndex: toIndex, updatedAt: new Date() })
      .where(eq(schema.tasks.id, id))
      .returning();
    return task;
  }

  // Task Comments
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return db.select().from(schema.taskComments).where(eq(schema.taskComments.taskId, taskId)).orderBy(schema.taskComments.createdAt);
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [result] = await db.insert(schema.taskComments).values(comment).returning();
    return result;
  }

  async updateTaskComment(id: string, commentData: Partial<InsertTaskComment>): Promise<TaskComment | undefined> {
    const [comment] = await db.update(schema.taskComments)
      .set({ ...commentData, updatedAt: new Date() })
      .where(eq(schema.taskComments.id, id))
      .returning();
    return comment;
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    const result = await db.delete(schema.taskComments).where(eq(schema.taskComments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Task Attachments
  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    return db.select().from(schema.taskAttachments).where(eq(schema.taskAttachments.taskId, taskId)).orderBy(schema.taskAttachments.createdAt);
  }

  async createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment> {
    const [result] = await db.insert(schema.taskAttachments).values(attachment).returning();
    return result;
  }

  async deleteTaskAttachment(id: string): Promise<boolean> {
    const result = await db.delete(schema.taskAttachments).where(eq(schema.taskAttachments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Subtasks
  async getSubtasks(taskId: string): Promise<Subtask[]> {
    return db.select().from(schema.subtasks).where(eq(schema.subtasks.taskId, taskId)).orderBy(schema.subtasks.sortIndex);
  }

  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    const [result] = await db.insert(schema.subtasks).values(subtask).returning();
    return result;
  }

  async updateSubtask(id: string, subtaskData: Partial<InsertSubtask>): Promise<Subtask | undefined> {
    const updates: any = { ...subtaskData };
    if (subtaskData.isCompleted && !(updates.completedAt)) {
      updates.completedAt = new Date();
    } else if (subtaskData.isCompleted === false) {
      updates.completedAt = null;
    }
    const [subtask] = await db.update(schema.subtasks).set(updates).where(eq(schema.subtasks.id, id)).returning();
    return subtask;
  }

  async deleteSubtask(id: string): Promise<boolean> {
    const result = await db.delete(schema.subtasks).where(eq(schema.subtasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Task Activity
  async getTaskActivity(taskId: string): Promise<TaskActivity[]> {
    return db.select().from(schema.taskActivity).where(eq(schema.taskActivity.taskId, taskId)).orderBy(desc(schema.taskActivity.createdAt));
  }

  async createTaskActivity(activity: InsertTaskActivity): Promise<TaskActivity> {
    const [result] = await db.insert(schema.taskActivity).values(activity).returning();
    return result;
  }

  // Board Members
  async getBoardMembers(boardId: string): Promise<BoardMember[]> {
    return db.select().from(schema.boardMembers).where(eq(schema.boardMembers.boardId, boardId)).orderBy(schema.boardMembers.createdAt);
  }

  async addBoardMember(member: InsertBoardMember): Promise<BoardMember> {
    const [result] = await db.insert(schema.boardMembers).values(member).returning();
    return result;
  }

  async updateBoardMember(id: string, memberData: Partial<InsertBoardMember>): Promise<BoardMember | undefined> {
    const [member] = await db.update(schema.boardMembers).set(memberData).where(eq(schema.boardMembers.id, id)).returning();
    return member;
  }

  async removeBoardMember(id: string): Promise<boolean> {
    const result = await db.delete(schema.boardMembers).where(eq(schema.boardMembers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
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

  // Leads
  async getAllLeads(ownerId: string): Promise<Lead[]> {
    return db.select().from(schema.leads)
      .where(eq(schema.leads.ownerId, ownerId))
      .orderBy(desc(schema.leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [result] = await db.insert(schema.leads).values(lead).returning();
    return result;
  }

  async updateLead(id: string, leadData: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db.update(schema.leads).set(leadData).where(eq(schema.leads.id, id)).returning();
    return lead;
  }

  async convertLeadToClient(leadId: string): Promise<{ client: Client; proposal: Proposal }> {
    const lead = await this.getLead(leadId);
    if (!lead) throw new Error("Lead not found");

    // Create client from lead
    const client = await this.createClient({
      ownerId: lead.ownerId,
      fullName: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone || null,
      notes: lead.notes || null,
    });

    // Create proposal from lead
    const proposal = await this.createProposal({
      ownerId: lead.ownerId,
      clientId: client.id,
      title: `Event Proposal - ${lead.firstName} ${lead.lastName}`,
      description: lead.notes || "Auto-generated from lead registration",
      amount: "0", // Default amount - needs to be updated
      status: "unviewed",
    });

    // Update lead status to converted
    await this.updateLead(leadId, { status: "converted" });

    return { client, proposal };
  }

  // Staff Applications
  async getAllStaffApplications(ownerId: string): Promise<StaffApplication[]> {
    return db.select().from(schema.staffApplications)
      .where(eq(schema.staffApplications.ownerId, ownerId))
      .orderBy(desc(schema.staffApplications.createdAt));
  }

  async getStaffApplication(id: string): Promise<StaffApplication | undefined> {
    const [application] = await db.select().from(schema.staffApplications).where(eq(schema.staffApplications.id, id));
    return application;
  }

  async createStaffApplication(application: InsertStaffApplication): Promise<StaffApplication> {
    const [result] = await db.insert(schema.staffApplications).values(application).returning();
    return result;
  }

  async updateStaffApplication(id: string, status: "pending" | "approved" | "rejected"): Promise<StaffApplication | undefined> {
    const [application] = await db.update(schema.staffApplications).set({ status }).where(eq(schema.staffApplications.id, id)).returning();
    return application;
  }

  async approveStaffApplication(id: string): Promise<{ application: StaffApplication; staff: Staff; user: User; temporaryPassword: string }> {
    const application = await this.getStaffApplication(id);
    if (!application) throw new Error("Staff application not found");

    // Generate secure random temporary password (16 characters)
    const temporaryPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);

    // Create user account for staff
    const user = await this.createUser({
      username: application.email.split("@")[0],
      email: application.email,
      password: temporaryPassword, // Will be hashed by createUser - admin must send this via email
      fullName: `${application.firstName} ${application.lastName}`,
      role: "staff",
    });

    // Create staff profile
    const staff = await this.createStaff({
      ownerId: application.ownerId,
      userId: user.id,
      bio: application.experience ?? null,
      skills: [],
      isActive: true,
    });

    // Update application status
    const updatedApplication = await this.updateStaffApplication(id, "approved");
    if (!updatedApplication) throw new Error("Failed to update application status");

    return { application: updatedApplication, staff, user, temporaryPassword };
  }

  async rejectStaffApplication(id: string): Promise<StaffApplication | undefined> {
    return this.updateStaffApplication(id, "rejected");
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    activeProposals: number;
    upcomingBookings: number;
    pendingTasks: number;
    noStaffAssigned: number;
    unpaidInvoices: number;
    openDeliverables: number;
  }> {
    const invoices = await db.select().from(schema.invoices);
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
    
    const activeProposals = await db.select().from(schema.proposals)
      .where(eq(schema.proposals.status, "viewed"));
    
    const upcomingBookings = await db.select().from(schema.bookings)
      .where(eq(schema.bookings.status, "confirmed"));
    
    const pendingTasks = await db.select().from(schema.tasks)
      .where(eq(schema.tasks.status, "todo"));

    // Count bookings with no staff assigned
    const allBookings = await db.select().from(schema.bookings);
    const bookingStaffAssignments = await db.select().from(schema.bookingStaff);
    const bookingsWithStaff = new Set(bookingStaffAssignments.map(bs => bs.bookingId));
    const noStaffAssigned = allBookings.filter(b => !bookingsWithStaff.has(b.id)).length;

    // Count unpaid invoices (status != 'paid' and balance > 0)
    const unpaidInvoices = invoices.filter(inv => inv.status !== "paid" && Number(inv.balance) > 0).length;

    // Count open deliverables (all deliverables for now - schema doesn't have status)
    const deliverables = await db.select().from(schema.deliverables);
    const openDeliverables = deliverables.length;

    return {
      totalRevenue,
      activeProposals: activeProposals.length,
      upcomingBookings: upcomingBookings.length,
      pendingTasks: pendingTasks.length,
      noStaffAssigned,
      unpaidInvoices,
      openDeliverables,
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

  // Automations
  async getAllAutomations(ownerId: string): Promise<Automation[]> {
    return db.select().from(schema.automations).where(eq(schema.automations.ownerId, ownerId));
  }

  async getAutomation(id: string): Promise<Automation | undefined> {
    const result = await db.select().from(schema.automations).where(eq(schema.automations.id, id));
    return result[0];
  }

  async createAutomation(automation: InsertAutomation): Promise<Automation> {
    const result = await db.insert(schema.automations).values(automation).returning();
    return result[0];
  }

  async updateAutomation(id: string, automation: Partial<InsertAutomation>): Promise<Automation | undefined> {
    const result = await db.update(schema.automations)
      .set(automation)
      .where(eq(schema.automations.id, id))
      .returning();
    return result[0];
  }

  async toggleAutomation(id: string): Promise<Automation | undefined> {
    const current = await this.getAutomation(id);
    if (!current) return undefined;
    
    const result = await db.update(schema.automations)
      .set({ isEnabled: !current.isEnabled })
      .where(eq(schema.automations.id, id))
      .returning();
    return result[0];
  }

  async deleteAutomation(id: string): Promise<boolean> {
    const result = await db.delete(schema.automations)
      .where(eq(schema.automations.id, id))
      .returning();
    return result.length > 0;
  }

  // Automation Logs
  async getAutomationLogs(automationId?: string, limit: number = 50): Promise<AutomationLog[]> {
    if (automationId) {
      return db.select()
        .from(schema.automationLogs)
        .where(eq(schema.automationLogs.automationId, automationId))
        .orderBy(desc(schema.automationLogs.runAt))
        .limit(limit);
    }
    return db.select()
      .from(schema.automationLogs)
      .orderBy(desc(schema.automationLogs.runAt))
      .limit(limit);
  }

  // Approvals
  async getAllApprovals(ownerId: string): Promise<Approval[]> {
    return db.select().from(schema.approvals).where(eq(schema.approvals.ownerId, ownerId));
  }

  async createApproval(approval: InsertApproval): Promise<Approval> {
    const result = await db.insert(schema.approvals).values(approval).returning();
    return result[0];
  }

  async updateApproval(id: string, approval: Partial<InsertApproval>): Promise<Approval | undefined> {
    const result = await db.update(schema.approvals)
      .set(approval)
      .where(eq(schema.approvals.id, id))
      .returning();
    return result[0];
  }

  // Analytics
  async getAnalyticsSummary(from: Date, to: Date, ownerId: string, staffId?: string): Promise<{
    revenue: number;
    bookings: number;
    avgBookingValue: number;
    conversionRate: number;
    taskCompletion: number;
    staffUtilization: number;
  }> {
    // Get bookings in date range (join with clients to filter by owner)
    const bookingsWithClients = await db.select()
      .from(schema.bookings)
      .innerJoin(schema.clients, eq(schema.bookings.clientId, schema.clients.id))
      .where(
        and(
          eq(schema.clients.ownerId, ownerId),
          gte(schema.bookings.startTime, from),
          lte(schema.bookings.startTime, to)
        )
      );
    
    const bookingCount = bookingsWithClients.length;

    // Calculate revenue from invoices for these bookings
    const bookingIds = bookingsWithClients.map(b => b.bookings.id);
    let revenue = 0;
    if (bookingIds.length > 0) {
      const invoices = await db.select()
        .from(schema.invoices)
        .where(or(...bookingIds.map(id => eq(schema.invoices.bookingId, id))));
      revenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    }
    
    const avgBookingValue = bookingCount > 0 ? revenue / bookingCount : 0;

    // Get leads in date range for conversion rate
    const leads = await db.select()
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.ownerId, ownerId),
          gte(schema.leads.createdAt, from),
          lte(schema.leads.createdAt, to)
        )
      );
    
    const conversionRate = leads.length > 0 ? (bookingCount / leads.length) * 100 : 0;

    // Get tasks in date range for completion rate
    const tasks = await db.select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.ownerId, ownerId),
          gte(schema.tasks.createdAt, from),
          lte(schema.tasks.createdAt, to)
        )
      );
    
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const taskCompletion = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // Get staff utilization
    const allStaffUsers = await db.select()
      .from(schema.staff)
      .innerJoin(schema.users, eq(schema.staff.userId, schema.users.id))
      .where(eq(schema.staff.ownerId, ownerId));
    
    const uniqueStaffAssigned = new Set();
    for (const bwc of bookingsWithClients) {
      const assignments = await db.select()
        .from(schema.bookingStaff)
        .where(eq(schema.bookingStaff.bookingId, bwc.bookings.id));
      assignments.forEach(a => uniqueStaffAssigned.add(a.staffId));
    }
    
    const staffUtilization = allStaffUsers.length > 0 ? (uniqueStaffAssigned.size / allStaffUsers.length) * 100 : 0;

    return {
      revenue,
      bookings: bookingCount,
      avgBookingValue,
      conversionRate,
      taskCompletion,
      staffUtilization,
    };
  }

  async getRevenueSeries(interval: 'day' | 'week' | 'month', from: Date, to: Date, ownerId: string): Promise<Array<{ label: string; value: number }>> {
    const bookingsWithClients = await db.select()
      .from(schema.bookings)
      .innerJoin(schema.clients, eq(schema.bookings.clientId, schema.clients.id))
      .where(
        and(
          eq(schema.clients.ownerId, ownerId),
          gte(schema.bookings.startTime, from),
          lte(schema.bookings.startTime, to)
        )
      )
      .orderBy(schema.bookings.startTime);

    // Get invoice data for revenue
    const bookingIds = bookingsWithClients.map(b => b.bookings.id);
    const invoiceMap = new Map<string, number>();
    
    if (bookingIds.length > 0) {
      const invoices = await db.select()
        .from(schema.invoices)
        .where(or(...bookingIds.map(id => eq(schema.invoices.bookingId, id))));
      
      invoices.forEach(inv => {
        if (inv.bookingId) {
          invoiceMap.set(inv.bookingId, Number(inv.total || 0));
        }
      });
    }

    // Group by interval
    const grouped: Record<string, number> = {};
    
    bookingsWithClients.forEach(({ bookings: booking }) => {
      if (!booking.startTime) return;
      
      const date = new Date(booking.startTime);
      let key: string;
      
      if (interval === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (interval === 'week') {
        const weekNum = Math.floor((date.getDate() - 1) / 7) + 1;
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${weekNum}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      const revenue = invoiceMap.get(booking.id) || 0;
      grouped[key] = (grouped[key] || 0) + revenue;
    });

    return Object.entries(grouped).map(([label, value]) => ({ label, value }));
  }

  async getStaffPerformance(from: Date, to: Date, ownerId: string): Promise<Array<{ staffId: string; staffName: string; bookingsCount: number; tasksCompleted: number }>> {
    const staffWithUsers = await db.select()
      .from(schema.staff)
      .innerJoin(schema.users, eq(schema.staff.userId, schema.users.id))
      .where(eq(schema.staff.ownerId, ownerId));
    
    const results = await Promise.all(staffWithUsers.map(async ({ staff: staffMember, users: user }) => {
      // Count bookings
      const bookings = await db.select()
        .from(schema.bookingStaff)
        .innerJoin(schema.bookings, eq(schema.bookingStaff.bookingId, schema.bookings.id))
        .where(
          and(
            eq(schema.bookingStaff.staffId, staffMember.id),
            gte(schema.bookings.startTime, from),
            lte(schema.bookings.startTime, to)
          )
        );

      // Count completed tasks
      const tasks = await db.select()
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.ownerId, ownerId),
            eq(schema.tasks.assignedTo, staffMember.userId),
            or(eq(schema.tasks.status, 'done'), eq(schema.tasks.status, 'completed')),
            gte(schema.tasks.createdAt, from),
            lte(schema.tasks.createdAt, to)
          )
        );

      return {
        staffId: staffMember.id,
        staffName: user.fullName || user.username,
        bookingsCount: bookings.length,
        tasksCompleted: tasks.length,
      };
    }));

    return results;
  }

  async getStatusDistribution(from: Date, to: Date, ownerId: string): Promise<Array<{ status: string; count: number }>> {
    const tasks = await db.select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.ownerId, ownerId),
          gte(schema.tasks.createdAt, from),
          lte(schema.tasks.createdAt, to)
        )
      );

    const distribution: Record<string, number> = {};
    tasks.forEach(task => {
      const status = task.status || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return Object.entries(distribution).map(([status, count]) => ({ status, count }));
  }
}

export const storage = new DatabaseStorage();
