# Project Rainbow CRM (Event OS)

### Overview

Project Rainbow CRM (Event OS) is a SaaS platform designed for event professionals, offering enterprise CRM functionalities tailored for the event industry. It aims to manage the entire customer lifecycle from lead generation to event delivery, integrating modules for client management, proposal creation, booking, invoicing, and task management. Key features include an Automations & Agents Framework for workflow automation and an Analytics & Reports System for business insights. The platform supports a multi-tenant architecture and plans to integrate AI for design suggestions, all presented with a unique rainbow gradient aesthetic. The project's ambition is to become a comprehensive Work OS for creative workflows, live assets, and event production.

### User Preferences

Preferred communication style: Simple, everyday language.

### System Architecture

**Frontend:**
- **Technology Stack:** React 18, TypeScript, Vite, Wouter, TanStack Query. Uses `shadcn/ui` built on Radix UI, and TailwindCSS.
- **Design System:** Empress-themed rainbow gradient topbar, deep purple brand colors, status-based color coding, consistent spacing, rounded card design, with light, dark, and system theme support.
- **Component Architecture:** Page-level and reusable UI components, application-level navigation. Form handling with React Hook Form and Zod, multi-step wizards, custom hooks.
- **State Management:** Server state via TanStack Query (optimistic updates), global UI state via React Context.

**Backend:**
- **Technology Stack:** Node.js with Express.js, TypeScript, Drizzle ORM, Neon Serverless PostgreSQL driver, Zod for runtime validation.
- **API Design:** RESTful endpoints (`/api`), resource-based routing, public endpoints (`/api/public`). Type-safe requests/responses with shared Zod schemas.
- **Storage Layer:** `IStorage` interface for CRUD, Drizzle ORM for type-safe schema.
- **Database Schema:** Multi-tenant design with `owner_id` foreign keys, role-based access control. Comprehensive schema for lead management, staff applications, clients, staff, proposals, bookings, invoices, payments, tasks, messaging, automations, approvals, and agent logs. Bcrypt for password hashing. JSONB fields for flexibility.
- **Middleware & Error Handling:** Request/response logging, JSON parsing, custom error handling, and structured logging with Pino.

**Authentication & Authorization:**
- Database-backed user accounts with roles. Session management via `connect-pg-simple`. Future plans for JWT-based authentication and role-based route protection.

**Data Storage Solutions:**
- **Primary Database:** PostgreSQL via Neon Serverless, managed with Drizzle ORM and Drizzle Kit for migrations. Schema defined in `shared/schema.ts`.

**Build & Deployment:**
- **Development:** Vite dev server, Express backend via `tsx watch`.
- **Production:** Client bundled via Vite, server bundled via esbuild. Static file serving.
- **Monorepo:** Shared code in `shared/`, with path aliases.

**Key Features & Design Patterns:**
- **Automations & Agents Framework:** Modular agent system with a registry pattern, automation execution engine, and scheduler (`node-cron`). Supports trigger events (e.g., `task.created`) and actions (e.g., `send_notification`).
- **Analytics & Reports System:** Backend for KPI aggregation (revenue, bookings, conversion) and time-series data. Frontend provides an analytics dashboard with KPI cards, date range controls, and Recharts visualizations. CSV export supported.
- **AI Design Agent:** Integrates with Leonardo API for AI-generated overlays and backdrops, triggered by client feedback requests. Logs operations to `agentLogs` table.
- **Asset Persistence & Uploads:** File upload system (multer) with size limits. Assets stored in `approvals.assetsJson` (JSONB) and served from `/uploads`. Includes a public client upload endpoint.
- **Theme System:** Global `ThemeContext` for light, dark, and system modes, persisted in `localStorage`.
- **Security:** Multi-tenant data isolation, strict Zod schema validation (`.strict()`), security headers (Helmet CSP, CORS), rate limiting, and comprehensive security regression tests.

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