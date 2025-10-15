# Project Rainbow CRM (Event OS)

## Overview

Project Rainbow CRM (Event OS) is a modern SaaS CRM and booking management platform designed for event professionals such as photo-booth owners, DJs, and mobile entertainment businesses. The application combines enterprise CRM functionality with creative event industry workflows, featuring a distinctive rainbow gradient aesthetic inspired by Empress AI Studio.

The platform enables event businesses to manage the complete customer lifecycle—from lead generation and proposals through booking confirmation, staff assignment, payment processing, and event delivery. It provides tools for client relationship management, proposal creation, booking engine configuration, invoice generation, task management, and team collaboration.

## Recent Changes

### Sprint 6: Kanban Project & Task Manager (October 2025) ✅
**Completed Features:**
- Monday.com-style Kanban board system with drag & drop task management
- Multi-board support with customizable workflow groups
- Visual task organization with status-based color coding
- Real-time task movement across board groups with position persistence
- Responsive Kanban UI with horizontal scrolling for multiple columns
- **Rich Task Features:**
  - Task detail drawer with tabbed interface (Overview, Comments, Attachments, Subtasks, Activity)
  - Comments system with CRUD operations and user attribution
  - Subtasks with checkbox completion tracking
  - Activity log automatically tracking all task changes
  - Task assignment to team members (staff, admin, owner roles)
  - Due date picker with calendar interface (prevents past dates)
  - Task description editor

**Technical Implementation:**
- Added `boards`, `board_groups`, `task_statuses` tables with varchar UUID primary keys
- Enhanced `tasks` table with board fields: `board_id`, `group_id`, `sort_index`, `linked_client_id`, `linked_booking_id`, `assigned_to`, `due_at`
- Added rich task feature tables: `task_comments`, `task_attachments`, `subtasks`, `task_activity`, `board_members`
- Integrated @dnd-kit library (@dnd-kit/core, sortable, modifiers, utilities) for drag & drop
- Implemented complete CRUD API: `/api/boards`, `/api/boards/:id/groups`, `/api/tasks/:id/move`
- Rich task APIs: `/api/tasks/:taskId/comments`, `/api/tasks/:taskId/subtasks`, `/api/tasks/:taskId/activity`
- Created BoardsPage (list view) and BoardView (Kanban board) components
- Built GroupColumn and TaskCard components with dnd-kit SortableContext
- Developed TaskDetailDrawer component with Tabs for organizing task content
- Added `/api/users/assignable` endpoint to fetch users for task assignment
- Integrated date-fns for date formatting and react-day-picker for calendar UI

**Bug Fixes:**
- Fixed board persistence after page reload by adding `enabled: !!user` to boards query (auth dependency)
- Corrected group title rendering - changed `group.name` to `group.title` to match schema field name
- Ensured proper task sort order preservation during drag & drop operations

### Sprint 5: Public Registration & Lead Management (October 2025) ✅
**Completed Features:**
- Public event registration form (`/register`) with multi-step wizard interface
- Lead management system with admin dashboard (`/leads`)
- Lead-to-client conversion workflow with automatic proposal generation
- Staff self-application portal (`/staff-apply`) for recruitment
- Staff approval system with temporary password generation
- Honeypot spam protection on public endpoints

**Technical Implementation:**
- Added `leads` and `staff_applications` tables to database schema
- Created public API endpoints: `/api/public/register` and `/api/public/staff-apply`
- Implemented PATCH `/api/leads/:id` with action-based routing for conversion
- Built approval workflow: POST `/api/staff-applications/:id/approve|reject`
- Enhanced Zod schemas with date string coercion for form handling
- Integrated bcrypt password hashing with cryptographically random 32-character temp passwords

**Bug Fixes:**
- Fixed PATCH handler to properly handle `{action: "convert"}` for lead conversion
- Corrected honeypot field handling (excluded from main payload, sent as separate field)
- Fixed date validation to accept ISO strings and coerce to Date objects
- Resolved authentication issues with apiRequest helper for Bearer token handling

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching
- shadcn/ui component library built on Radix UI primitives
- TailwindCSS for utility-first styling with custom design tokens

**Design System:**
- Empress-themed rainbow gradient topbar (fuchsia → rose → amber) with 6% opacity overlay
- Brand colors centered around deep purple (#3c0b43) for primary actions and dark purple (#1f0a23) for navigation
- Status-based color coding system (inspired by Monday.com) for proposals, bookings, payments, and tasks
- Consistent spacing primitives using Tailwind units (2, 4, 6, 8, 12, 16, 20, 24, 32)
- Rounded card design (rounded-2xl) with soft shadows
- Custom CSS variables for theme consistency across light/dark modes

**Component Architecture:**
- Page-level components in `client/src/pages/` for major application views (Dashboard, Clients, Staff, Bookings, Proposals, Invoices, Tasks, Messages, Leads, Staff Applications)
- Public-facing pages without authentication (Register, Login, Staff Apply)
- Reusable UI components from shadcn/ui in `client/src/components/ui/`
- Application-level components like `AppSidebar` for navigation structure
- Form handling with React Hook Form and Zod validation
- Multi-step form wizards with stepper components for complex workflows
- Custom hooks for mobile responsiveness and toast notifications

**State Management Pattern:**
- Server state managed through TanStack Query with optimistic updates
- Query keys structured as REST-like paths (`["/api/clients"]`, `["/api/bookings"]`)
- Mutations invalidate related queries to trigger automatic refetching
- Global UI state (toasts, dialogs) managed through context and custom hooks

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js for REST API endpoints
- TypeScript for type-safe server code
- Drizzle ORM for database interactions
- Neon Serverless PostgreSQL driver for database connectivity
- Zod for runtime schema validation

**API Design:**
- RESTful endpoint structure under `/api` prefix
- Resource-based routing (clients, staff, proposals, bookings, invoices, payments, tasks, messages, leads, staff-applications)
- Public endpoints under `/api/public` for registration and staff applications
- Dashboard-specific aggregation endpoints for stats and charts
- Special action endpoints for workflows (lead conversion, staff approval/rejection)
- Type-safe request/response handling using shared Zod schemas
- Honeypot spam protection on public endpoints

**Storage Layer:**
- Storage abstraction pattern with `IStorage` interface defining all data operations
- Implements CRUD operations for all entities (users, clients, staff, proposals, bookings, invoices, payments, settings)
- Separation of concerns between route handlers (validation/response) and storage logic (database queries)
- Drizzle ORM queries using strongly-typed schema definitions

**Database Schema Design:**
- Multi-tenant architecture with `owner_id` foreign keys linking resources to account owners
- Role-based access control with user roles (owner, admin, staff, client)
- Comprehensive event management schema covering the full booking lifecycle:
  - **Lead Management** - Captures event registrations with status tracking (new, qualified, converted, archived)
  - **Staff Applications** - Public recruitment portal with approval workflow (pending, approved, rejected)
  - Client management with referral tracking
  - Staff profiles with skills and availability
  - Proposals with status tracking (unviewed, viewed, expired, accepted)
  - Bookings with event details, venue information, and staff assignments
  - Invoice and payment tracking with multiple payment methods
  - Task management with priorities and status workflows
  - Internal and client-facing messaging systems
- Settings tables for payment processors, booking engine configuration, privacy controls, and payment plans
- JSONB fields for flexible metadata storage where schema flexibility is needed
- Automatic password generation with bcrypt hashing for staff approvals

**Middleware & Error Handling:**
- Request/response logging middleware with timing information
- JSON body parsing
- Custom error handling middleware with status code and message extraction
- Development-only middleware for Vite integration and error overlays

### Authentication & Authorization

**Current Implementation:**
- Database-backed user accounts with role field (owner, admin, staff, client)
- Users table includes authentication credentials and profile information
- Role-based access control foundation prepared for future implementation
- Session management infrastructure ready (connect-pg-simple package included)

**Planned Enhancement:**
- JWT-based authentication tokens
- Role-based route protection
- Session persistence with PostgreSQL session store

### Data Storage Solutions

**Primary Database:**
- PostgreSQL via Neon Serverless with WebSocket-based connectivity
- Drizzle ORM for type-safe schema definitions and query building
- Migration system using Drizzle Kit with schema stored in `shared/schema.ts`
- Database provisioning through environment variable `DATABASE_URL`

**Schema Management:**
- Single source of truth schema in `shared/schema.ts` shared between client and server
- Drizzle Zod integration for automatic Zod schema generation from database schema
- Migration files generated in `./migrations` directory
- Push-based migration strategy with `npm run db:push`

### Build & Deployment Architecture

**Development Mode:**
- Vite dev server with Hot Module Replacement (HMR)
- Express backend running concurrently via tsx watch mode
- Replit-specific plugins for runtime error overlay and development banner
- Source maps enabled for debugging

**Production Build:**
- Client bundled via Vite to `dist/public`
- Server bundled via esbuild to `dist/index.js` with ESM format
- Static file serving from Vite build output
- Single production server process serving both API and static assets

**Monorepo Structure:**
- Shared code in `shared/` directory (schema definitions, types)
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)
- TypeScript configuration covers client, server, and shared code
- Workspace-style organization with clear separation of concerns

## External Dependencies

### UI Component Library
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives (accordion, alert-dialog, avatar, badge, button, calendar, card, carousel, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sidebar, skeleton, slider, switch, tabs, textarea, toast, toggle, tooltip)
- **Radix UI**: Headless UI primitives for accessible component development
- **Lucide React**: Icon library for consistent iconography

### Data Visualization
- **Recharts**: Charting library for dashboard revenue and analytics visualizations

### Form Handling
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for forms and API requests
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Styling
- **TailwindCSS**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: Type-safe variant styling
- **clsx & tailwind-merge**: Conditional className composition

### Database & ORM
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver with WebSocket support
- **Drizzle ORM**: Type-safe SQL query builder
- **drizzle-zod**: Automatic Zod schema generation from Drizzle schemas
- **ws**: WebSocket library required for Neon serverless connection

### State Management
- **@tanstack/react-query**: Powerful async state management for server data

### Date Handling
- **date-fns**: Modern date utility library
- **react-day-picker**: Date picker component for calendar interactions

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions (prepared for authentication implementation)

### UI Utilities
- **cmdk**: Command palette component
- **embla-carousel-react**: Carousel/slider functionality
- **vaul**: Drawer component primitive

### Development Tools
- **Vite**: Fast build tool and dev server
- **esbuild**: JavaScript bundler for production server builds
- **tsx**: TypeScript execution for development server
- **TypeScript**: Type-safe development across frontend and backend
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator

### Future Integration Opportunities
Based on attached documentation, the following integrations are planned but not yet implemented:
- **Stripe**: Payment processing for invoices and deposits
- **Square/PayPal**: Alternative payment processors
- **Mailgun**: Transactional email service
- **Twilio**: SMS notifications
- **Google Calendar API**: Calendar synchronization for event scheduling