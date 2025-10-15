import { Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  UserSquare,
  FileText,
  Calendar,
  CalendarDays,
  Receipt,
  CheckSquare,
  MessageSquare,
  Settings,
  CreditCard,
  Globe,
  UserPlus,
  ClipboardList,
  LayoutGrid,
  Zap,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    group: "Dashboard",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard, testId: "link-dashboard" },
    ],
  },
  {
    group: "Sales",
    items: [
      { title: "Leads", url: "/leads", icon: UserPlus, testId: "link-leads" },
      { title: "Clients", url: "/clients", icon: Users, testId: "link-clients" },
      { title: "Proposals", url: "/proposals", icon: FileText, testId: "link-proposals" },
      { title: "Bookings", url: "/bookings", icon: Calendar, testId: "link-bookings" },
      { title: "Invoices", url: "/invoices", icon: Receipt, testId: "link-invoices" },
    ],
  },
  {
    group: "Manage",
    items: [
      { title: "Staff", url: "/staff", icon: UserSquare, testId: "link-staff" },
      { title: "Staff Applications", url: "/staff-applications", icon: ClipboardList, testId: "link-staff-applications" },
      { title: "Boards", url: "/boards", icon: LayoutGrid, testId: "link-boards" },
      { title: "Tasks", url: "/tasks", icon: CheckSquare, testId: "link-tasks" },
      { title: "Calendar", url: "/calendar", icon: CalendarDays, testId: "link-calendar" },
      { title: "Automations", url: "/automations", icon: Zap, testId: "link-automations" },
      { title: "Analytics", url: "/analytics", icon: BarChart3, testId: "link-analytics" },
      { title: "Messages", url: "/messages", icon: MessageSquare, testId: "link-messages" },
    ],
  },
  {
    group: "Settings",
    items: [
      { title: "Payment Settings", url: "/settings/payments", icon: CreditCard, testId: "link-payment-settings" },
      { title: "Booking Engine", url: "/settings/booking-engine", icon: Globe, testId: "link-booking-engine" },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        {menuItems.map((section) => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
