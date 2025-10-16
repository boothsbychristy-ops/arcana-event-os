# Project Rainbow CRM (Event OS)

## Overview

Project Rainbow CRM (Event OS) is a SaaS platform for event professionals (e.g., photo-booth owners, DJs). It offers enterprise CRM functionality combined with event industry workflows, all presented with a distinctive rainbow gradient aesthetic. The platform manages the entire customer lifecycle, from lead generation and proposals to booking, staff assignment, payment, and event delivery. It includes modules for client relationship management, proposal creation, a booking engine, invoicing, task management, and team collaboration. Recent enhancements include an Automations & Agents Framework for workflow automation and an Analytics & Reports System for key business insights. The platform aims to integrate AI for design suggestions and offers a robust, multi-tenant architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18 with TypeScript, Vite, Wouter, TanStack Query. `shadcn/ui` built on Radix UI, TailwindCSS.

**Design System:** Empress-themed rainbow gradient topbar, deep purple brand colors, status-based color coding, consistent Tailwind spacing, rounded card design. Supports light, dark, and system themes.

**Component Architecture:** Page-level components, reusable UI components, application-level navigation. Form handling with React Hook Form and Zod, multi-step wizards, custom hooks.

**State Management:** Server state via TanStack Query with optimistic updates. Global UI state via React Context.

### Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript, Drizzle ORM, Neon Serverless PostgreSQL driver, Zod for runtime validation.

**API Design:** RESTful endpoints (`/api`), resource-based routing, public endpoints (`/api/public`). Type-safe requests/responses with shared Zod schemas.

**Storage Layer:** `IStorage` interface for CRUD operations, Drizzle ORM for type-safe schema.

**Database Schema:** Multi-tenant with `owner_id` foreign keys, role-based access control (owner, admin, staff, client). Comprehensive schema for lead management, staff applications, clients, staff, proposals, bookings, invoices, payments, tasks, and messaging. JSONB fields for flexibility. Bcrypt for password hashing. Includes tables for automations, automation logs, approvals, and agent logs.

**Middleware & Error Handling:** Request/response logging, JSON parsing, custom error handling.

### Authentication & Authorization

**Current:** Database-backed user accounts with roles. Session management ready with `connect-pg-simple`.

**Planned:** JWT-based authentication, role-based route protection, PostgreSQL session store.

### Data Storage Solutions

**Primary Database:** PostgreSQL via Neon Serverless, Drizzle ORM. Migration system with Drizzle Kit. Single source of truth schema in `shared/schema.ts`.

### Build & Deployment Architecture

**Development:** Vite dev server with HMR, Express backend via `tsx watch`.

**Production:** Client bundled via Vite, server bundled via esbuild. Static file serving from Vite build.

**Monorepo:** Shared code in `shared/`, path aliases (`@/`, `@shared/`, `@assets/`).

### Key Features & Design Patterns

**Automations & Agents Framework:** Modular agent system with a registry pattern for pluggable action handlers. Automation execution engine with error handling and logging. Scheduler system for time-based triggers (e.g., `node-cron`). Supports trigger events (e.g., `task.created`, `task.overdue`) and actions (e.g., `send_notification`, `update_status`).

**Analytics & Reports System:** Backend methods for KPI aggregation (revenue, bookings, conversion, tasks, staff utilization) and time-series data. Frontend provides an analytics dashboard with KPI cards, date range controls, and Recharts visualizations (line, bar, pie charts). Supports CSV export.

**AI Design Agent:** Integrates with Leonardo API for AI-generated overlays and backdrops. Auto-triggers on client feedback requests, using approval title and description as theme hints. Operations are logged to an `agentLogs` table.

**Theme System:** Global `ThemeContext` for light, dark, and system modes, persisted in `localStorage`. Applies corresponding classes to the HTML root. UI adapts automatically through CSS variables.

## External Dependencies

### UI Component Library
- **shadcn/ui**: Component library built on Radix UI.
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
- **node-cron**: Task scheduler.

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

### Security
- **helmet**: HTTP security headers.
- **express-rate-limit**: Rate limiting.
- **cookie-parser**: For future cookie-based auth.