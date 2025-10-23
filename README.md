# Arcana Event OS (Rainbow-CRM)

**The invisible system behind unforgettable events.**

Arcana is a comprehensive SaaS platform designed specifically for event professionals, offering enterprise-grade CRM functionalities tailored to the event industry. The platform manages the entire customer lifecycle from lead generation to event delivery, with powerful automation, analytics, and AI-assisted design capabilities.

## 🌟 Features

### Core CRM Capabilities
- **Lead Management**: Track and nurture leads through the sales pipeline
- **Client Relationship Management**: Comprehensive client profiles and interaction history
- **Staff Management**: Role-based access control and staff application processing
- **Proposal System**: Create, manage, and track event proposals
- **Booking Management**: Complete booking lifecycle management
- **Invoice & Payment Tracking**: Financial management with payment processing

### Dynamic Boards System
Inspired by Monday.com, our flexible board system provides:
- **Custom Fields**: Text, number, date, status, dropdown, and checkbox field types
- **Multiple Views**: Switch between Table, Kanban, Calendar, and Timeline views
- **Drag & Drop**: Intuitive column reordering and card management
- **Inline Editing**: Quick updates directly within the board interface

### Intelligent Automation
- **No-Code Automation Builder**: Create complex workflows without coding
- **Smart Triggers**: Field changes, item creation, date arrival, and scheduled events
- **Powerful Actions**: Notifications, field updates, item creation, emails, and webhooks
- **Smart Agents**: Proactive reminders for overdue tasks, upcoming bookings, and pending items

### Analytics & Reporting
- **KPI Dashboard**: Revenue tracking, booking metrics, and conversion rates
- **Time-Series Visualization**: Trend analysis with interactive charts
- **Custom Date Ranges**: Flexible reporting periods
- **CSV Export**: Export data for external analysis

### AI-Powered Design
- **Leonardo API Integration**: AI-generated event design assets
- **Automated Overlays**: Create professional backdrops and overlays
- **Client Feedback Loop**: AI responds to client design requests

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **TailwindCSS** with custom twilight-violet-gold theme
- **shadcn/ui** components built on Radix UI
- **TanStack Query** for server state management
- **React Hook Form** + **Zod** for type-safe forms

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **PostgreSQL** via Neon Serverless
- **Drizzle ORM** for type-safe database access
- **JWT Authentication** with role-based access control
- **Pino** for structured logging

### Infrastructure
- **Replit** deployment with autoscale
- **Neon** serverless PostgreSQL
- **Multer** for file uploads
- **node-cron** for scheduled tasks

## 📦 Installation

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database (or Neon account)
- npm or pnpm

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Rainbow-CRM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `SESSION_SECRET`: Another secure random string

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

## 🏗️ Project Structure

```
Rainbow-CRM/
├── client/                 # React frontend application
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page-level components
│       └── App.tsx         # Main application entry
├── server/                 # Express backend application
│   ├── agents/            # Automation agent system
│   ├── hooks/             # Event hooks
│   ├── lib/               # Utility functions
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   └── index.ts           # Server entry point
├── shared/                # Shared code (schemas, types)
│   └── schema.ts          # Database schema + Zod validators
├── migrations/            # Database migration files
└── uploads/               # File upload storage
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push schema changes to database

### Database Management

The project uses Drizzle ORM for database management. The schema is defined in `shared/schema.ts`.

To push schema changes:
```bash
npm run db:push
```

## 🚢 Deployment

### Railway Deployment (Recommended)

Deploy to Railway in 5 minutes:

1. Go to https://railway.app
2. Create new project from GitHub repo: `boothsbychristy-ops/arcana-event-os`
3. Add PostgreSQL database
4. Configure environment variables (see `.env.railway`)
5. Deploy automatically

**Quick Start:** See [RAILWAY_QUICKSTART.md](./RAILWAY_QUICKSTART.md)

**Full Guide:** See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

### Replit Deployment

This project is configured for deployment on Replit with autoscale:

1. Import the repository into Replit
2. Configure environment variables in Replit Secrets
3. The `.replit` file contains all deployment configuration
4. Click "Run" to start the application

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables** for production

3. **Start the server**
   ```bash
   npm run start
   ```

## 🔐 Security

- **Multi-tenant isolation**: Database-level tenant separation with `owner_id`
- **JWT authentication**: Secure token-based authentication with rotation support
- **Role-based access control**: Owner, Admin, and Staff roles
- **Input validation**: Strict Zod schema validation on all inputs
- **Security headers**: Helmet CSP, CORS configuration
- **Rate limiting**: API endpoint protection
- **Password hashing**: bcrypt for secure password storage

## 📚 API Documentation

The API follows RESTful conventions with the following structure:

- **Base path**: `/api`
- **Public endpoints**: `/api/public`
- **Authentication**: JWT token in Authorization header

All requests and responses are type-safe with shared Zod schemas.

## 🎨 Design System

The application features a custom **twilight-violet-gold** theme with:
- Deep purple accents
- Status-based color coding
- Light, dark, and system theme support
- Consistent spacing and rounded card design
- Accessible color contrasts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🌐 Links

- **Canonical Domain**: [arcana.events](https://arcana.events)
- **Documentation**: Coming soon
- **Support**: Contact via GitHub Issues

## 🙏 Acknowledgments

Built with modern web technologies and best practices for the event industry.

---

**Welcome to Arcana.** This is where work gets approved, aligned, and brought to life.

