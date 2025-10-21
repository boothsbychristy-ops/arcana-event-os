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
  empressRole: text("empress_role").default("user"), // admin, user - for council features
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Clients table with referral tracking  
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  referralCode: text("referral_code").unique(),
  referredBy: varchar("referred_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Staff profiles
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  staffId: varchar("staff_id").references(() => staff.id).notNull(),
  role: text("role"), // photographer, dj, assistant, etc.
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

// Invoices linked to bookings
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  processor: text("processor").notNull(), // stripe, square, paypal
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  method: text("method").notNull(), // card, check, cash, venmo, zelle, cashapp
  displayName: text("display_name").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  instructions: text("instructions"),
});

// Booking engine general settings
export const bookingEngineSettings = pgTable("booking_engine_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  assignedTo: varchar("assigned_to").references(() => users.id),
  dueAt: timestamp("due_at"),
  linkedClientId: varchar("linked_client_id").references(() => clients.id),
  linkedBookingId: varchar("linked_booking_id").references(() => bookings.id),
  meta: jsonb("meta").default({}),
  sortIndex: integer("sort_index").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Task comments for threaded discussions
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Task attachments for file uploads
export const taskAttachments = pgTable("task_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subtasks for checklist items
export const subtasks = pgTable("subtasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  sortIndex: integer("sort_index").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Task activity log for audit trail
export const taskActivity = pgTable("task_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // created, updated, moved, commented, assigned, etc.
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Board members for permissions
export const boardMembers = pgTable("board_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").references(() => boards.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull().default("viewer"), // owner, editor, viewer
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// PHASE 12.0: Dynamic Boards System (Monday.com-style flexible schema)
// ============================================================================

// Dynamic Boards - flexible board containers
export const dynamicBoards = pgTable("dynamic_boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // emoji or icon name
  color: text("color"), // hex color for board theme
  isTemplate: boolean("is_template").notNull().default(false),
  sortIndex: integer("sort_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Dynamic Fields - custom columns with flexible types
export const dynamicFields = pgTable("dynamic_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").references(() => dynamicBoards.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // text, number, date, status, dropdown, checkbox, user, email, phone, url
  description: text("description"),
  config: jsonb("config").default({}), // type-specific config: { options: [], format: '', etc. }
  isRequired: boolean("is_required").notNull().default(false),
  sortIndex: integer("sort_index").notNull().default(0),
  width: integer("width"), // column width in pixels
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Dynamic Items - flexible rows/records
export const dynamicItems = pgTable("dynamic_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").references(() => dynamicBoards.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // primary label/title
  sortIndex: integer("sort_index").notNull().default(0),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Dynamic Field Values - EAV pattern for flexible data storage
export const dynamicFieldValues = pgTable("dynamic_field_values", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => dynamicItems.id, { onDelete: "cascade" }).notNull(),
  fieldId: varchar("field_id").references(() => dynamicFields.id, { onDelete: "cascade" }).notNull(),
  value: text("value"), // stored as text, parsed by field type
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

// Automations for agent-based workflow automation
export const automations = pgTable("automations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  triggerEvent: text("trigger_event").notNull(), // 'task.created', 'task.status_changed', 'task.due_soon'
  condition: jsonb("condition").default({}),
  action: text("action").notNull(), // 'send_notification', 'update_status', 'create_subtasks'
  actionConfig: jsonb("action_config").default({}),
  isEnabled: boolean("is_enabled").notNull().default(true),
  runScope: text("run_scope").notNull().default("immediate"), // 'immediate' | 'scheduled'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Automation execution logs
export const automationLogs = pgTable("automation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  automationId: varchar("automation_id").references(() => automations.id, { onDelete: "cascade" }).notNull(),
  runAt: timestamp("run_at").notNull().defaultNow(),
  status: text("status").notNull().default("ok"), // 'ok' | 'error' | 'skipped'
  message: text("message"),
  context: jsonb("context").default({}),
});

// Approvals for client design review and feedback with expiry and view tracking
export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, approved, feedback, rejected
  draftUrl: text("draft_url"), // AI-generated overlay/backdrop preview
  assetsJson: jsonb("assets_json").default({}), // Store selected backgrounds, templates, etc.
  shareToken: text("share_token").unique(), // For public sharing
  feedbackNotes: text("feedback_notes"),
  shareExpiresAt: timestamp("share_expires_at"), // Link expiry time
  viewsCount: integer("views_count").default(0), // Number of times viewed
  lastViewedAt: timestamp("last_viewed_at"), // Last time the link was viewed
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Agent logs for AI Design Agent and other AI operations
export const agentLogs = pgTable("agent_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  agent: text("agent").notNull(), // 'design', 'analysis', etc.
  operation: text("operation").notNull(),
  status: text("status").notNull().default("info"), // info, success, error
  context: jsonb("context").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ========== ENHANCED RAINBOW CRM FEATURES ==========

// Events linked to clients
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  eventDate: timestamp("event_date"),
  location: text("location"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  notes: text("notes"),
  stage: text("stage").notNull().default("planning"), // planning | design | production | delivery
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Projects (design/asset work linked to events)
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type"), // overlay | backdrop | ai_prompt | video
  status: text("status").notNull().default("in_progress"), // in_progress | waiting_approval | approved
  dueDate: timestamp("due_date"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  mirrorMeta: jsonb("mirror_meta").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Design proofs for client review with versioning
export const proofs = pgTable("proofs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token").notNull().unique().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  mirrorMeta: jsonb("mirror_meta").default({}),
  status: text("status").notNull().default("pending"), // pending | approved | changes_requested
  clientComment: text("client_comment"),
  version: integer("version").default(1), // Version tracking
  prevProofId: varchar("prev_proof_id"), // Link to previous version - reference added later to avoid circular dependency
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Comments on proofs with pins and reasons
export const proofComments = pgTable("proof_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proofId: varchar("proof_id").references(() => proofs.id, { onDelete: "cascade" }).notNull(),
  author: text("author").notNull(), // "Client" | "Admin"
  message: text("message").notNull(),
  x: decimal("x"), // Pin x coordinate (0-1)
  y: decimal("y"), // Pin y coordinate (0-1)
  zoom: decimal("zoom"), // Zoom level when pin was placed
  reason: text("reason").default("other"), // logo, color, text, other
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Asset library for uploaded and generated files with derivatives and soft delete
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"), // image/png, image/jpeg, video/mp4, etc
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category").notNull().default("upload"), // upload | overlay | backdrop | ai_render | video
  tags: text("tags").array(),
  mirrorMeta: jsonb("mirror_meta").default({}),
  sizeKb: decimal("size_kb", { precision: 10, scale: 2 }),
  derivatives: jsonb("derivatives").default({}), // {320: url, 640: url, 1280: url}
  alt: text("alt"), // Alt text for accessibility
  deletedAt: timestamp("deleted_at"), // Soft delete support
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// System logs for automation and health monitoring
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // webhook | client | server | health
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  meta: jsonb("meta").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User preferences for notifications and settings
export const userPrefs = pgTable("user_prefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  receiveEmails: boolean("receive_emails").notNull().default(true),
  timezone: text("timezone").notNull().default("UTC"),
  dailyDigest: boolean("daily_digest").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics events for tracking and insights
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // proof_approved, asset_uploaded, client_created, etc
  entityId: varchar("entity_id"),
  entityTable: text("entity_table"),
  meta: jsonb("meta").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Mirror Protocol wallets for coin accounting
export const mirrorWallets = pgTable("mirror_wallets", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Mirror Protocol transaction logs
export const mirrorTx = pgTable("mirror_tx", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  delta: integer("delta").notNull(), // negative = spend
  reason: text("reason").notNull(), // mockup, reverse_vision, etc
  meta: jsonb("meta").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tenant watermark settings
export const tenantSettings = pgTable("tenant_settings", {
  tenantId: varchar("tenant_id").primaryKey(),
  watermarkEnabled: boolean("watermark_enabled").default(true),
  watermarkText: text("watermark_text").default("Proof — Rainbow CRM"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Council alert configurations
export const councilAlerts = pgTable("council_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").unique(), // approval_median_hours, etc
  threshold: decimal("threshold").notNull(),
  direction: text("direction").notNull(), // above, below
  enabled: boolean("enabled").default(true),
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
export const insertDynamicBoardSchema = createInsertSchema(dynamicBoards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDynamicFieldSchema = createInsertSchema(dynamicFields).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDynamicItemSchema = createInsertSchema(dynamicItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDynamicFieldValueSchema = createInsertSchema(dynamicFieldValues).omit({ id: true, updatedAt: true });
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskAttachmentSchema = createInsertSchema(taskAttachments).omit({ id: true, createdAt: true });
export const insertSubtaskSchema = createInsertSchema(subtasks).omit({ id: true, createdAt: true, completedAt: true });
export const insertTaskActivitySchema = createInsertSchema(taskActivity).omit({ id: true, createdAt: true });
export const insertBoardMemberSchema = createInsertSchema(boardMembers).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertDeliverableSchema = createInsertSchema(deliverables).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true }).extend({
  eventDate: z.string().nullable().optional().transform(val => val ? new Date(val) : null),
});
export const insertStaffApplicationSchema = createInsertSchema(staffApplications).omit({ id: true, createdAt: true });
export const insertAutomationSchema = createInsertSchema(automations).omit({ id: true, createdAt: true });
export const insertAutomationLogSchema = createInsertSchema(automationLogs).omit({ id: true, runAt: true });
export const insertApprovalSchema = createInsertSchema(approvals).omit({ id: true, createdAt: true, approvedAt: true });
export const insertAgentLogSchema = createInsertSchema(agentLogs).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProofSchema = createInsertSchema(proofs).omit({ id: true, token: true, createdAt: true, updatedAt: true });
export const insertProofCommentSchema = createInsertSchema(proofComments).omit({ id: true, createdAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({ id: true, createdAt: true });
export const insertUserPrefSchema = createInsertSchema(userPrefs).omit({ id: true, createdAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, createdAt: true });
export const insertMirrorWalletSchema = createInsertSchema(mirrorWallets).omit({ updatedAt: true });
export const insertMirrorTxSchema = createInsertSchema(mirrorTx).omit({ id: true, createdAt: true });
export const insertTenantSettingsSchema = createInsertSchema(tenantSettings).omit({ createdAt: true });
export const insertCouncilAlertSchema = createInsertSchema(councilAlerts).omit({ id: true, createdAt: true });

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

export type DynamicBoard = typeof dynamicBoards.$inferSelect;
export type InsertDynamicBoard = z.infer<typeof insertDynamicBoardSchema>;

export type DynamicField = typeof dynamicFields.$inferSelect;
export type InsertDynamicField = z.infer<typeof insertDynamicFieldSchema>;

export type DynamicItem = typeof dynamicItems.$inferSelect;
export type InsertDynamicItem = z.infer<typeof insertDynamicItemSchema>;

export type DynamicFieldValue = typeof dynamicFieldValues.$inferSelect;
export type InsertDynamicFieldValue = z.infer<typeof insertDynamicFieldValueSchema>;

export type TaskStatus = typeof taskStatuses.$inferSelect;
export type InsertTaskStatus = z.infer<typeof insertTaskStatusSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = z.infer<typeof insertTaskAttachmentSchema>;

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;

export type TaskActivity = typeof taskActivity.$inferSelect;
export type InsertTaskActivity = z.infer<typeof insertTaskActivitySchema>;

export type BoardMember = typeof boardMembers.$inferSelect;
export type InsertBoardMember = z.infer<typeof insertBoardMemberSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type StaffApplication = typeof staffApplications.$inferSelect;
export type InsertStaffApplication = z.infer<typeof insertStaffApplicationSchema>;

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;

export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = z.infer<typeof insertAutomationLogSchema>;

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;

export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Proof = typeof proofs.$inferSelect;
export type InsertProof = z.infer<typeof insertProofSchema>;

export type ProofComment = typeof proofComments.$inferSelect;
export type InsertProofComment = z.infer<typeof insertProofCommentSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;

export type UserPref = typeof userPrefs.$inferSelect;
export type InsertUserPref = z.infer<typeof insertUserPrefSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type MirrorWallet = typeof mirrorWallets.$inferSelect;
export type InsertMirrorWallet = z.infer<typeof insertMirrorWalletSchema>;

export type MirrorTx = typeof mirrorTx.$inferSelect;
export type InsertMirrorTx = z.infer<typeof insertMirrorTxSchema>;

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
