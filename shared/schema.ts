import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer,
  decimal,
  boolean,
  json,
  jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("client"), // owner, admin, staff, client
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Clients table with referral tracking
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  referralCode: text("referral_code").unique(),
  referredBy: varchar("referred_by").references(() => clients.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Staff profiles
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title"),
  bio: text("bio"),
  skills: text("skills").array(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Proposals with status workflow
export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("unviewed"), // unviewed, viewed, accepted, expired, canceled
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  validUntil: timestamp("valid_until"),
  viewedAt: timestamp("viewed_at"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bookings with venue and event details
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  proposalId: varchar("proposal_id").references(() => proposals.id),
  title: text("title").notNull(),
  eventType: text("event_type"), // wedding, birthday, corporate, etc.
  status: text("status").notNull().default("confirmed"), // confirmed, completed, canceled
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  venueName: text("venue_name"),
  venueAddress: text("venue_address"),
  venueCity: text("venue_city"),
  venueState: text("venue_state"),
  venueZip: text("venue_zip"),
  guestCount: integer("guest_count"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Staff assignments to bookings
export const bookingStaff = pgTable("booking_staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  staffId: varchar("staff_id").references(() => staff.id).notNull(),
  role: text("role"), // photographer, dj, assistant, etc.
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

// Invoices linked to bookings
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoice line items
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

// Payments with multiple methods
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(), // card, check, cash, venmo, zelle, cashapp
  processor: text("processor"), // stripe, square, paypal
  transactionId: text("transaction_id"),
  notes: text("notes"),
  paidAt: timestamp("paid_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment settings and processor configuration
export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processor: text("processor").notNull().unique(), // stripe, square, paypal
  isConnected: boolean("is_connected").notNull().default(false),
  apiKey: text("api_key"),
  publicKey: text("public_key"),
  webhookSecret: text("webhook_secret"),
  settings: jsonb("settings"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payment plans (installments)
export const paymentPlans = pgTable("payment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  installments: integer("installments").notNull(),
  intervalDays: integer("interval_days").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment methods configuration
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  method: text("method").notNull().unique(), // card, check, cash, venmo, zelle, cashapp
  displayName: text("display_name").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  instructions: text("instructions"),
});

// Booking engine general settings
export const bookingEngineSettings = pgTable("booking_engine_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requireApproval: boolean("require_approval").notNull().default(true),
  allowGuestCheckout: boolean("allow_guest_checkout").notNull().default(false),
  minAdvanceBookingDays: integer("min_advance_booking_days").notNull().default(7),
  maxAdvanceBookingDays: integer("max_advance_booking_days").notNull().default(365),
  depositRequired: boolean("deposit_required").notNull().default(false),
  depositPercentage: integer("deposit_percentage").notNull().default(50),
  confirmationEmailTemplate: text("confirmation_email_template"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Extra booking questions
export const bookingQuestions = pgTable("booking_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  fieldType: text("field_type").notNull(), // text, textarea, select, radio, checkbox
  options: text("options").array(), // for select/radio/checkbox
  isRequired: boolean("is_required").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Booking question responses
export const bookingResponses = pgTable("booking_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  questionId: varchar("question_id").references(() => bookingQuestions.id).notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Unavailable date notices
export const unavailableNotices = pgTable("unavailable_notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Privacy and consent settings
export const privacySettings = pgTable("privacy_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  termsOfService: text("terms_of_service"),
  privacyPolicy: text("privacy_policy"),
  cookieConsent: boolean("cookie_consent").notNull().default(true),
  dataRetentionDays: integer("data_retention_days").notNull().default(365),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Boards for Kanban project management
export const boards = pgTable("boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Board groups (columns) for Kanban organization
export const boardGroups = pgTable("board_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").references(() => boards.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  sortIndex: integer("sort_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Task statuses (configurable colored labels per board)
export const taskStatuses = pgTable("task_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").references(() => boards.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),
  color: text("color").notNull(), // hex color or CSS token
  sortIndex: integer("sort_index").notNull().default(0),
});

// Tasks for Kanban board - enhanced to support both booking tasks and board tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").references(() => boards.id, { onDelete: "cascade" }),
  groupId: varchar("group_id").references(() => boardGroups.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => bookings.id),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, review, done
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  assignedTo: varchar("assigned_to").references(() => staff.id),
  dueAt: timestamp("due_at"),
  linkedClientId: varchar("linked_client_id").references(() => clients.id),
  linkedBookingId: varchar("linked_booking_id").references(() => bookings.id),
  meta: jsonb("meta").default({}),
  sortIndex: integer("sort_index").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Message threads
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  audience: text("audience").notNull().default("internal"), // internal, client
  attachments: text("attachments").array(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Deliverables (final files, photos, videos, links)
export const deliverables = pgTable("deliverables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  kind: text("kind").notNull().default("link"), // link, photo, video, file
  title: text("title").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Leads from public registration
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  eventDate: timestamp("event_date"),
  packageId: varchar("package_id"),
  notes: text("notes"),
  status: text("status", { enum: ["new", "qualified", "converted", "archived"] }).notNull().default("new"),
  answers: jsonb("answers"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Staff applications for self-signup
export const staffApplications = pgTable("staff_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  experience: text("experience"),
  portfolioUrl: text("portfolio_url"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, viewedAt: true, acceptedAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertBookingStaffSchema = createInsertSchema(bookingStaff).omit({ id: true, assignedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, paidAt: true });
export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({ id: true, updatedAt: true });
export const insertPaymentPlanSchema = createInsertSchema(paymentPlans).omit({ id: true, createdAt: true });
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ id: true });
export const insertBookingEngineSettingsSchema = createInsertSchema(bookingEngineSettings).omit({ id: true, updatedAt: true });
export const insertBookingQuestionSchema = createInsertSchema(bookingQuestions).omit({ id: true, createdAt: true });
export const insertBookingResponseSchema = createInsertSchema(bookingResponses).omit({ id: true, createdAt: true });
export const insertUnavailableNoticeSchema = createInsertSchema(unavailableNotices).omit({ id: true, createdAt: true });
export const insertPrivacySettingsSchema = createInsertSchema(privacySettings).omit({ id: true, updatedAt: true });
export const insertBoardSchema = createInsertSchema(boards).omit({ id: true, createdAt: true });
export const insertBoardGroupSchema = createInsertSchema(boardGroups).omit({ id: true, createdAt: true });
export const insertTaskStatusSchema = createInsertSchema(taskStatuses).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertDeliverableSchema = createInsertSchema(deliverables).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true }).extend({
  eventDate: z.string().nullable().optional().transform(val => val ? new Date(val) : null),
});
export const insertStaffApplicationSchema = createInsertSchema(staffApplications).omit({ id: true, createdAt: true });

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type BookingStaff = typeof bookingStaff.$inferSelect;
export type InsertBookingStaff = z.infer<typeof insertBookingStaffSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;

export type PaymentPlan = typeof paymentPlans.$inferSelect;
export type InsertPaymentPlan = z.infer<typeof insertPaymentPlanSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type BookingEngineSettings = typeof bookingEngineSettings.$inferSelect;
export type InsertBookingEngineSettings = z.infer<typeof insertBookingEngineSettingsSchema>;

export type BookingQuestion = typeof bookingQuestions.$inferSelect;
export type InsertBookingQuestion = z.infer<typeof insertBookingQuestionSchema>;

export type BookingResponse = typeof bookingResponses.$inferSelect;
export type InsertBookingResponse = z.infer<typeof insertBookingResponseSchema>;

export type UnavailableNotice = typeof unavailableNotices.$inferSelect;
export type InsertUnavailableNotice = z.infer<typeof insertUnavailableNoticeSchema>;

export type PrivacySettings = typeof privacySettings.$inferSelect;
export type InsertPrivacySettings = z.infer<typeof insertPrivacySettingsSchema>;

export type Board = typeof boards.$inferSelect;
export type InsertBoard = z.infer<typeof insertBoardSchema>;

export type BoardGroup = typeof boardGroups.$inferSelect;
export type InsertBoardGroup = z.infer<typeof insertBoardGroupSchema>;

export type TaskStatus = typeof taskStatuses.$inferSelect;
export type InsertTaskStatus = z.infer<typeof insertTaskStatusSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type StaffApplication = typeof staffApplications.$inferSelect;
export type InsertStaffApplication = z.infer<typeof insertStaffApplicationSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["owner", "admin", "staff", "client"]).default("client"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
