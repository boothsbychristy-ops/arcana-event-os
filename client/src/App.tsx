import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Footer } from "@/components/Footer";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import StaffApply from "@/pages/staff-apply";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Leads from "@/pages/leads";
import Staff from "@/pages/staff";
import StaffApplications from "@/pages/staff-applications";
import Proposals from "@/pages/proposals";
import Bookings from "@/pages/bookings";
import BookingDetail from "@/pages/booking-detail";
import Invoices from "@/pages/invoices";
import Tasks from "@/pages/tasks";
import Boards from "@/pages/boards";
import BoardView from "@/pages/board-view";
import Calendar from "@/pages/calendar";
import Messages from "@/pages/messages";
import Automations from "@/pages/automations";
import Analytics from "@/pages/Analytics";
import Approvals from "@/pages/approvals";
import PaymentSettings from "@/pages/settings/payment-settings";
import BookingEngineSettings from "@/pages/settings/booking-engine";
import Pipeline from "@/pages/Pipeline";
import ProofPortal from "@/pages/ProofPortal";
import AssetLibrary from "@/pages/AssetLibrary";
import ApprovalPublic from "@/pages/approval-public";
import Council from "@/pages/dashboard/council";
import DynamicBoards from "@/pages/DynamicBoards";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ProtectedRoute({ component: Component, ...rest }: { component: () => JSX.Element; path?: string }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/staff-apply" component={StaffApply} />
      <Route path="/approval/:token" component={ApprovalPublic} />
      <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/clients">{() => <ProtectedRoute component={Clients} />}</Route>
      <Route path="/leads">{() => <ProtectedRoute component={Leads} />}</Route>
      <Route path="/staff">{() => <ProtectedRoute component={Staff} />}</Route>
      <Route path="/staff-applications">{() => <ProtectedRoute component={StaffApplications} />}</Route>
      <Route path="/proposals">{() => <ProtectedRoute component={Proposals} />}</Route>
      <Route path="/bookings">{() => <ProtectedRoute component={Bookings} />}</Route>
      <Route path="/bookings/:id">{() => <ProtectedRoute component={BookingDetail} />}</Route>
      <Route path="/invoices">{() => <ProtectedRoute component={Invoices} />}</Route>
      <Route path="/tasks">{() => <ProtectedRoute component={Tasks} />}</Route>
      <Route path="/boards">{() => <ProtectedRoute component={Boards} />}</Route>
      <Route path="/boards/:id">{() => <ProtectedRoute component={BoardView} />}</Route>
      <Route path="/calendar">{() => <ProtectedRoute component={Calendar} />}</Route>
      <Route path="/messages">{() => <ProtectedRoute component={Messages} />}</Route>
      <Route path="/automations">{() => <ProtectedRoute component={Automations} />}</Route>
      <Route path="/analytics">{() => <ProtectedRoute component={Analytics} />}</Route>
      <Route path="/approvals">{() => <ProtectedRoute component={Approvals} />}</Route>
      <Route path="/pipeline">{() => <ProtectedRoute component={Pipeline} />}</Route>
      <Route path="/proofs/:projectId">{() => <ProtectedRoute component={ProofPortal} />}</Route>
      <Route path="/assets">{() => <ProtectedRoute component={AssetLibrary} />}</Route>
      <Route path="/settings/payments">{() => <ProtectedRoute component={PaymentSettings} />}</Route>
      <Route path="/settings/booking-engine">{() => <ProtectedRoute component={BookingEngineSettings} />}</Route>
      <Route path="/dashboard/council">{() => <ProtectedRoute component={Council} />}</Route>
      <Route path="/dynamic-boards">{() => <ProtectedRoute component={DynamicBoards} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  // Show public pages without sidebar
  const publicPages = ["/login", "/register", "/staff-apply"];
  const isPublicPage = publicPages.includes(location) || location.startsWith("/approval/");
  if (isPublicPage) {
    return <Router />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-gradient-to-r from-violet-600 via-purple-600 to-amber-500 bg-opacity-[0.06]">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white" />
              <h1 className="text-xl font-bold text-white">Arcana</h1>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{user.fullName}</span>
                <div className="text-white">
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  data-testid="button-logout"
                  className="text-white hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppLayout />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
