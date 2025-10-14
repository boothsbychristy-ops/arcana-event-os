# Design Guidelines: Project Rainbow CRM (Event OS)

## Design Approach
**Reference-Based**: Inspired by Check Cherry and Monday.com with Empress AI Studio's distinctive rainbow gradient aesthetic. The design balances enterprise CRM functionality with creative event industry visual appeal.

## Core Design Elements

### A. Color Palette

**Primary Rainbow Gradient** (Empress Signature):
- Gradient: `linear-gradient(90deg, #d946ef 0%, #f97316 30%, #22c55e 60%, #06b6d4 100%)`
- Applied to: Topbar with 6% opacity overlay for subtle effect

**Brand Colors**:
- Primary: `#3c0b43` (deep purple) - CTA buttons, primary actions
- Navigation Background: `#1f0a23` (darker purple)
- Brand scale (50-900): From `#fdf2ff` to `#701a75`

**Status Chips** (Monday.com style):
- Proposal: Gray (#6b7280)
- Confirmed: Green (#22c55e)
- Paid: Emerald (#10b981)
- Completed: Indigo (#6366f1)
- Canceled: Rose (#f43f5e)
- Unviewed: Slate (#64748b)
- Viewed: Blue (#3b82f6)
- Expired: Amber (#f59e0b)
- Accepted: Green (#22c55e)

### B. Typography
- Font Family: System UI stack (default Tailwind)
- Hierarchy: Clear distinction between headers, body text, and UI labels
- Use Tailwind's default text sizing utilities

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24, 32
- Card padding: `p-4` to `p-6`
- Section spacing: `py-12` to `py-20`
- Gap utilities: `gap-4`, `gap-6`, `gap-8`

**Container Widths**:
- Dashboard: `max-w-7xl`
- Settings pages: `max-w-5xl`
- Forms: `max-w-2xl`

### D. Component Library

**Cards**:
- Base: `rounded-2xl border bg-white shadow-sm`
- Hover states: `hover:shadow-md transition-shadow`
- Padding: `p-4` or `p-6` depending on content density

**Buttons**:
- Primary: `rounded-lg bg-[#3c0b43] text-white px-4 py-2`
- Secondary: `rounded-lg border border-gray-300 bg-white text-gray-700`
- Danger: `rounded-lg bg-rose-600 text-white`

**Inputs & Forms**:
- Inputs: `rounded-lg border border-gray-300 px-3 py-2`
- Focus: `focus:ring-2 focus:ring-brand-500 focus:border-transparent`
- Labels: `text-sm font-medium text-gray-700 mb-1`

**Status Badges**:
- Pill shape: `rounded-full px-3 py-1 text-xs font-medium`
- Color-coded per status (see Color Palette)

**Navigation**:
- Top bar: Rainbow gradient background, white text, 64px height
- Left sidebar: Grouped sections (Dashboard, Sales, Manage, Settings)
- Active state: Subtle highlight or underline

**Data Displays**:
- Tables: Clean, minimal borders, zebra striping optional
- Cards grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Lists: Spacious, clear separators between items

**Overlays**:
- Modals: `rounded-2xl bg-white shadow-2xl max-w-lg`
- Dropdowns: `rounded-lg shadow-lg border bg-white`
- Tooltips: Minimal, dark background

### E. Animations
Use sparingly:
- Transitions: `transition-all duration-200 ease-in-out`
- Hover states on cards and buttons
- Modal entrance/exit
- NO complex scroll animations or parallax effects

## Page-Specific Layouts

### Dashboard
- **Three-column layout**: Revenue chart (left), Upcoming bookings (center), Action counters (right)
- Revenue chart: Recharts bar chart with monthly data, subtle colors
- Action counters: Grid of cards with icon, number, and label
- Upcoming bookings: List with client name, date/time, venue, staff avatars

### Bookings List
- **Filter sidebar** (left): Status toggles, date range picker, awaiting flags
- **Main content**: Card grid or list view toggle
- **Booking cards**: Title, date/time, venue, client name, staff avatars (circular, overlapping), status badge
- **Actions**: Three-dot menu with View, Assign Staff, Message, Open Invoice

### Booking Detail
- **Header**: Large status badge, booking title, "Make Payment" button
- **Content sections** (accordion or tabs):
  - Overview, Checklists/Tasks, Designs, Questionnaires, Invoice, Attachments, Messages
- **Right sidebar**: Key details (schedule, venue with Google Maps link, staff assignments, payment summary)

### Settings Pages
- **Tab navigation** across top for multi-section pages
- **Form sections**: Clear labels, help text below inputs, grouped related fields
- **Payment processors**: Large cards with Connect/Disconnect buttons, status indicator
- **Payment methods**: Toggle switches for enable/disable, drag handles for reordering

### Proposals & Invoices
- **Table layout** with status filters
- **Detail view**: Clean header with status, line items table, action buttons footer
- **Payment modal**: Method selector (radio), amount input, confirm button

## Visual Treatments

**Avatars**:
- Circular, 32px or 40px diameter
- Stack with overlap: `-ml-2` on subsequent avatars
- Border: `border-2 border-white` for separation

**Charts** (Recharts):
- Simple bar or line charts
- Brand colors for data series
- Minimal legend
- Subtle grid lines

**Empty States**:
- Icon + message + CTA button
- Centered in container
- Friendly, encouraging copy

**Loading States**:
- Skeleton screens for lists/cards
- Spinner for buttons/forms
- Subtle, non-distracting

## Images
**Where to Use**:
- Client/staff avatars (circular)
- Backdrop/design galleries (rectangular cards with aspect ratio 4:3)
- Empty states (illustrative icons)

**No hero images** needed - this is a dashboard/admin application, not a marketing site.

## Accessibility
- Maintain WCAG AA contrast ratios
- Focus states visible on all interactive elements
- Semantic HTML with proper heading hierarchy
- Screen reader labels for icon-only buttons

## Responsive Behavior
- Mobile: Single column, collapsible sidebar, bottom navigation bar
- Tablet: Two-column layouts where appropriate
- Desktop: Full multi-column layouts, persistent sidebar

This design system creates a professional, visually distinctive CRM that honors the Empress AI Studio brand while delivering the robust functionality of Check Cherry and Monday.com.