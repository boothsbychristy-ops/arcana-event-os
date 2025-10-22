# Arcana (Event OS)

### Overview

Arcana is a SaaS platform designed for event professionals - the invisible system behind unforgettable events. It offers enterprise CRM functionalities tailored for the event industry, managing the entire customer lifecycle from lead generation to event delivery. The platform integrates modules for client management, proposal creation, booking, invoicing, and task management. Key features include an Automations & Agents Framework for workflow automation, Analytics & Reports System for business insights, and Dynamic Boards for flexible workflow management. Arcana supports a multi-tenant architecture with AI-powered design assistance, all presented with a twilight-violet-gold aesthetic. Canonical domain: arcana.events

### Welcome Message

Welcome to Arcana.
This is where work gets approved, aligned, and brought to life.

### Tagline

The invisible system behind unforgettable events.

### User Preferences

Preferred communication style: Simple, everyday language.

### System Architecture

**Frontend:**
- **Technology Stack:** React 18, TypeScript, Vite, Wouter, TanStack Query. Uses `shadcn/ui` built on Radix UI, and TailwindCSS.
- **Design System:** Twilight-violet-gold theme with deep purple accents, status-based color coding, consistent spacing, rounded card design, with light, dark, and system theme support.
- **Component Architecture:** Page-level and reusable UI components, application-level navigation. Form handling with React Hook Form and Zod, multi-step wizards, custom hooks.
- **State Management:** Server state via TanStack Query (optimistic updates), global UI state via React Context.

**Backend:**
- **Technology Stack:** Node.js with Express.js, TypeScript, Drizzle ORM, Neon Serverless PostgreSQL driver, Zod for runtime validation.
- **API Design:** RESTful endpoints (`/api`), resource-based routing, public endpoints (`/api/public`). Type-safe requests/responses with shared Zod schemas.
- **Storage Layer:** `IStorage` interface for CRUD, Drizzle ORM for type-safe schema.
- **Database Schema:** Multi-tenant design with `owner_id` foreign keys, role-based access control. Comprehensive schema for lead management, staff applications, clients, staff, proposals, bookings, invoices, payments, tasks, messaging, automations, approvals, agent logs, and dynamic boards. Bcrypt for password hashing. JSONB fields for flexibility.
- **Middleware & Error Handling:** Request/response logging, JSON parsing, custom error handling, and structured logging with Pino.

**Authentication & Authorization:**
- Database-backed user accounts with roles (owner, admin, staff). JWT-based authentication with role-based route protection.

**Data Storage Solutions:**
- **Primary Database:** PostgreSQL via Neon Serverless, managed with Drizzle ORM and Drizzle Kit for migrations. Schema defined in `shared/schema.ts`.

**Build & Deployment:**
- **Development:** Vite dev server, Express backend via `tsx watch`.
- **Production:** Client bundled via Vite, server bundled via esbuild. Static file serving.
- **Monorepo:** Shared code in `shared/`, with path aliases.
- **Target Domain:** arcana.events

**Key Features & Design Patterns:**
- **Dynamic Boards (Phase 12.0):** Monday.com-style flexible boards with custom fields, drag-and-drop column reordering, inline editing, and field type support (text, number, date, status, dropdown, checkbox).
- **Board Automations (Phase 13.0):** No-code automation engine with trigger-action rules. Supports on_field_change, on_item_create, on_date_arrive, and cron_schedule triggers. Actions include notify_user, set_field_value, create_item, send_email, and call_webhook. Multi-step wizard UI for creating automations.
- **Automations & Agents Framework:** Modular agent system with registry pattern, automation execution engine, and scheduler (`node-cron`). Supports trigger events and actions.
- **Analytics & Reports System:** Backend for KPI aggregation (revenue, bookings, conversion) and time-series data. Frontend provides analytics dashboard with KPI cards, date range controls, and Recharts visualizations. CSV export supported.
- **AI Design Agent:** Integrates with Leonardo API for AI-generated overlays and backdrops, triggered by client feedback requests. Logs operations to `agentLogs` table.
- **Asset Persistence & Uploads:** File upload system (multer) with size limits. Assets stored in `approvals.assetsJson` (JSONB) and served from `/uploads`. Includes public client upload endpoint.
- **Theme System:** Global `ThemeContext` for light, dark, and system modes, persisted in `localStorage`.
- **Security:** Multi-tenant data isolation, strict Zod schema validation (`.strict()`), security headers (Helmet CSP, CORS), rate limiting, and comprehensive security regression tests.
- **Arcana Council:** Admin oversight dashboard for system-wide metrics, user management, and compliance monitoring.

### External Dependencies

**UI Component Libraries:**
- `shadcn/ui` (built on Radix UI)
- `Radix UI`
- `Lucide React` (icon library)

**Data Visualization:**
- `Recharts`

**Form Handling:**
- `React Hook Form`
- `Zod`
- `@hookform/resolvers`

**Styling:**
- `TailwindCSS`
- `class-variance-authority`
- `clsx` & `tailwind-merge`

**Database & ORM:**
- `@neondatabase/serverless` (Neon PostgreSQL driver)
- `Drizzle ORM`
- `drizzle-zod`
- `ws` (WebSocket library for Neon)

**State Management:**
- `@tanstack/react-query`

**Date Handling:**
- `date-fns`
- `react-day-picker`

**Session Management:**
- `connect-pg-simple`

**Automation & Scheduling:**
- `node-cron`

**File Uploads:**
- `multer`

**UI Utilities:**
- `cmdk` (command palette)
- `embla-carousel-react` (carousel)
- `vaul` (drawer component)

**Development Tools:**
- `Vite`
- `esbuild`
- `tsx`
- `TypeScript`

**Security:**
- `helmet`
- `express-rate-limit`
- `cookie-parser`
- `supertest`
- `pino` (structured logging)

### Recent Changes

**Phase 12.4 - Multiple Views (Current)**
- Added boardViews table to persist user-created custom views
- Implemented view management system with create/delete/set-default operations
- Created BoardViewSwitcher component for view selection and management
- Built KanbanView with drag-and-drop cards organized by status field
- Built CalendarView with FullCalendar integration for date-based items
- Built TimelineView with Gantt-style horizontal timeline visualization
- Integrated view switcher and conditional rendering in DynamicBoards.tsx
- View types: table (default), kanban, calendar, timeline
- Each board can have multiple named views with different configurations

**Phase 12.3 - Smart Agents & Follow-Up System**
- Added agentRules and agentNotificationLogs tables for proactive reminders
- Implemented agent evaluation engine with cron-based checking (every 5 minutes)
- Created Agent Settings UI page for managing agent rules
- Built in-app toast notification system with 60-second polling
- Supports multiple trigger types: task_overdue, booking_upcoming, invoice_unpaid, proposal_pending
- Configurable notification channels: email, in_app, or both
- Notification logs track lastSentAt to prevent spam
- Agent personas support: professional, friendly, urgent tones

**Phase 13.0 - Board Automations Engine**
- Added boardAutomationRules and boardAutomationLogs tables
- Implemented trigger-action automation system
- Created AutomationBuilder wizard component
- Integrated automations into Dynamic Boards view
- Set up cron scheduler for scheduled triggers
- Added event hooks for real-time automation triggers

**Phase 12.0 - Dynamic Boards**
- Implemented Monday.com-style flexible boards
- Added custom field types and inline editing
- Drag-and-drop column reordering
- Multi-tenant board system
