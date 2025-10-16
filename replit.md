# Project Rainbow CRM (Event OS)

## Overview

Project Rainbow CRM (Event OS) is a SaaS platform designed for event professionals (e.g., photo-booth owners, DJs). It combines enterprise CRM functionality with event industry workflows, featuring a distinctive rainbow gradient aesthetic. The platform manages the entire customer lifecycle, from lead generation and proposals to booking confirmation, staff assignment, payment processing, and event delivery. It includes tools for client relationship management, proposal creation, booking engine configuration, invoice generation, task management, and team collaboration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- `shadcn/ui` built on Radix UI, TailwindCSS for styling.

**Design System:**
- Empress-themed rainbow gradient topbar, deep purple brand colors, status-based color coding (Monday.com inspired), consistent Tailwind spacing, rounded card design.
- Custom CSS variables for theme consistency.

**Component Architecture:**
- Page-level components for major views, public-facing pages, reusable UI components (`shadcn/ui`), application-level navigation (`AppSidebar`).
- Form handling with React Hook Form and Zod, multi-step form wizards, custom hooks for responsiveness and toast notifications.

**State Management Pattern:**
- Server state via TanStack Query with optimistic updates, REST-like query keys, mutations invalidate queries for refetching. Global UI state (toasts, dialogs) via context and custom hooks.

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js, TypeScript, Drizzle ORM, Neon Serverless PostgreSQL driver, Zod for runtime validation.

**API Design:**
- RESTful endpoints under `/api`, resource-based routing, public endpoints under `/api/public`.
- Dashboard aggregation endpoints, workflow action endpoints (lead conversion, staff approval).
- Type-safe request/response with shared Zod schemas, honeypot spam protection.

**Storage Layer:**
- `IStorage` interface for data operations, CRUD for all entities, separation of concerns between handlers and storage logic.
- Drizzle ORM with strongly-typed schema definitions.

**Database Schema Design:**
- Multi-tenant with `owner_id` foreign keys, role-based access control (owner, admin, staff, client).
- Comprehensive event management schema: Lead Management, Staff Applications, Client, Staff, Proposals, Bookings, Invoice, Payment, Task management, Messaging.
- Settings tables for payment processors, booking engine, privacy.
- JSONB fields for flexible metadata.
- Bcrypt hashing for password generation.

**Middleware & Error Handling:**
- Request/response logging, JSON body parsing, custom error handling, development-only middleware for Vite integration.

### Authentication & Authorization

**Current Implementation:**
- Database-backed user accounts with role field (owner, admin, staff, client).
- Session management infrastructure ready with `connect-pg-simple`.

**Planned Enhancement:**
- JWT-based authentication, role-based route protection, PostgreSQL session store.

### Data Storage Solutions

**Primary Database:**
- PostgreSQL via Neon Serverless, Drizzle ORM for type-safe queries.
- Migration system with Drizzle Kit, schema in `shared/schema.ts`.

**Schema Management:**
- Single source of truth schema in `shared/schema.ts` (client/server), Drizzle Zod for automatic Zod schema generation.
- Push-based migration strategy.

### Build & Deployment Architecture

**Development Mode:**
- Vite dev server with HMR, Express backend via `tsx watch`.
- Replit-specific plugins for error overlay and dev banner.

**Production Build:**
- Client bundled via Vite to `dist/public`, server bundled via esbuild to `dist/index.js`.
- Static file serving from Vite build output, single production server.

**Monorepo Structure:**
- Shared code in `shared/`, path aliases (`@/`, `@shared/`, `@assets/`).
- TypeScript configuration for client, server, and shared code.

## External Dependencies

### UI Component Library
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives.
- **Radix UI**: Headless UI primitives.
- **Lucide React**: Icon library.

### Data Visualization
- **Recharts**: Charting library.

### Form Handling
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **@hookform/resolvers**: Integration for React Hook Form and Zod.

### Styling
- **TailwindCSS**: Utility-first CSS framework.
- **class-variance-authority**: Type-safe variant styling.
- **clsx & tailwind-merge**: Conditional className composition.

### Database & ORM
- **@neondatabase/serverless**: Neon PostgreSQL driver.
- **Drizzle ORM**: Type-safe SQL query builder.
- **drizzle-zod**: Zod schema generation from Drizzle schemas.
- **ws**: WebSocket library for Neon.

### State Management
- **@tanstack/react-query**: Async state management.

### Date Handling
- **date-fns**: Date utility library.
- **react-day-picker**: Date picker component.

### Session Management
- **connect-pg-simple**: PostgreSQL session store.

### Automation & Scheduling
- **node-cron**: Task scheduler for time-based automations.

### UI Utilities
- **cmdk**: Command palette.
- **embla-carousel-react**: Carousel/slider.
- **vaul**: Drawer component.

### Development Tools
- **Vite**: Build tool and dev server.
- **esbuild**: JS bundler for production.
- **tsx**: TypeScript execution.
- **TypeScript**: Type-safe development.
- **@replit/vite-plugin-runtime-error-modal**: Dev error overlay.
- **@replit/vite-plugin-cartographer**: Replit-specific dev tooling.
- **@replit/vite-plugin-dev-banner**: Dev environment indicator.

## Recent Changes (Sprint 8)

### Automations & Agents Framework (October 2025)

**Backend Implementation:**
- Added `automations` and `automation_logs` tables to database schema with support for trigger events, conditions, and configurable actions.
- Created modular agent system with registry pattern (`server/agents/registry.ts`) for pluggable action handlers.
- Implemented automation execution engine (`server/agents/engine.ts`) with comprehensive error handling and logging.
- Built scheduler system (`server/agents/scheduler.ts`) using node-cron for time-based automation triggers (hourly checks for overdue tasks).
- Integrated automation triggers into task creation and status change workflows for immediate event-based execution.

**Available Actions:**
- `send_notification`: Send notifications to users with custom messages
- `update_status`: Automatically update task status based on conditions
- `create_subtasks`: Generate subtasks from templates when conditions are met

**Trigger Events:**
- `task.created`: Fires immediately when new tasks are created
- `task.status_changed`: Fires when task status is updated
- `task.assigned`: Fires when tasks are assigned to users
- `task.overdue`: Fires hourly for overdue tasks via cron scheduler

**API Endpoints:**
- CRUD operations for automations (`/api/automations`)
- Toggle automation enable/disable (`/api/automations/:id/toggle`)
- Manual automation execution (`/api/automations/:id/run`)
- Execution log retrieval (`/api/automations/logs`)

**Frontend Implementation:**
- Created AutomationsPage (`client/src/pages/automations.tsx`) with comprehensive UI for managing automations.
- Features include: table view of all automations, creation modal with form validation, toggle switches for enable/disable, logs drawer for execution history, and manual run/delete actions.
- Integrated into sidebar navigation under "Manage" section with Zap icon.
- Full support for JSON configuration of conditions and actions with validation.

**Architecture:**
- Agent registry pattern allows easy addition of new action types.
- Separation of immediate triggers (event-based) and scheduled triggers (cron-based).
- Comprehensive logging system tracks all automation executions with success/failure status and error details.
- Multi-tenant support with owner-based automation isolation.

### Analytics & Reports System (Sprint 9 - October 2025)

**Backend Implementation:**
- Added analytics storage methods to `server/storage.ts` for KPI aggregation and time-series data.
- Implemented `getAnalyticsSummary()` to calculate revenue, bookings, conversion rates, task completion, and staff utilization metrics.
- Created `getRevenueSeries()` for time-series revenue data with daily/weekly/monthly intervals.
- Built `getStaffPerformance()` to track staff bookings and tasks completed.
- Added `getStatusDistribution()` for task status breakdown analytics.
- Proper database schema alignment using joins (bookings→clients→users, staff→users, invoices for revenue).

**API Endpoints:**
- GET `/api/analytics/summary?from={ISO}&to={ISO}` - Returns 6 KPI metrics
- GET `/api/analytics/revenue-series?interval={day|week|month}&from={ISO}&to={ISO}` - Time series revenue data
- GET `/api/analytics/staff-performance?from={ISO}&to={ISO}` - Staff performance metrics
- GET `/api/analytics/status-distribution?from={ISO}&to={ISO}` - Task status breakdown
- GET `/api/analytics/export?type={revenue|staff|tasks}&from={ISO}&to={ISO}` - CSV export with proper auth

**Frontend Implementation:**
- Created AnalyticsPage (`client/src/pages/analytics.tsx`) with comprehensive dashboard UI.
- 6 KPI cards displaying: Total Revenue, Total Bookings, Avg Booking Value, Conversion Rate, Task Completion, Staff Utilization.
- Date range controls: Presets (7 days, 30 days, this/last month, 90 days, this year) and custom date picker.
- Recharts visualizations:
  - LineChart for revenue over time with interval selector (day/week/month)
  - BarChart for staff performance (bookings vs tasks completed)
  - PieChart for task status distribution
- CSV export functionality for all chart types with authenticated downloads.
- Integrated into sidebar navigation under "Manage" section with BarChart3 icon.

**Features:**
- Role-based data filtering (owners see all data, staff see personal metrics via staffId parameter).
- Responsive design with loading states for all queries.
- Real-time metric calculation based on selected date ranges.
- Multi-tenant support with proper ownerId filtering through table joins.

**Technical Details:**
- Uses TanStack Query for data fetching with proper TypeScript typing.
- Revenue calculated from invoices table (not bookings.totalPrice which doesn't exist).
- Bookings filtered via startTime field (not eventDate which doesn't exist).
- Staff metrics joined with users table for proper name display and owner filtering.
- Date presets automatically adjust interval selection for optimal chart display.

## Security Hardening (October 2025)

**Critical Security Fixes Applied:**

1. **JWT Authentication Hardening**
   - Removed insecure fallback JWT secret
   - Server now fails fast with clear error if JWT_SECRET not set
   - Requires secure random 32-byte secret in environment variables

2. **Privilege Escalation Prevention**
   - Fixed signup vulnerability where users could self-assign admin/owner roles
   - All signups now force 'client' role
   - Added protected `/api/users/:id/role` endpoint (requires admin/owner access)

3. **Rate Limiting & DDoS Protection**
   - Installed express-rate-limit middleware
   - Auth endpoints limited to 20 attempts per 10 minutes per IP
   - Prevents brute-force attacks on login

4. **Security Headers**
   - Added Helmet middleware for HTTP security headers
   - Protection against common web vulnerabilities (XSS, clickjacking, etc.)

5. **PII Data Protection**
   - Replaced verbose response body logging with safe metadata logging
   - Logs now only capture: method, path, status code, duration
   - No sensitive data (emails, addresses, passwords) in logs

6. **Database Performance Indexes**
   - Added indexes for analytics queries: bookings(created_at, start_time)
   - Task indexes: tasks(created_at, updated_at)
   - Invoice indexes: invoices(created_at)
   - Multi-tenant index: boards(owner_id)

**Known Security Issues (Documented in SECURITY_AUDIT.md):**

⚠️ **CRITICAL: Multi-Tenant Data Leakage**
- Most tables lack `ownerId` column (clients, staff, proposals, bookings, invoices, payments)
- Data currently shared across all tenants - requires schema migration to fix
- Documented in SECURITY_AUDIT.md with full remediation plan
- **DO NOT DEPLOY TO PRODUCTION** until multi-tenant isolation is implemented

**Security Packages Added:**
- helmet (HTTP security headers)
- express-rate-limit (rate limiting)
- cookie-parser (for future cookie-based auth)