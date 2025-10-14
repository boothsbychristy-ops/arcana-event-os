import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Staff from "@/pages/staff";
import Proposals from "@/pages/proposals";
import Bookings from "@/pages/bookings";
import BookingDetail from "@/pages/booking-detail";
import Invoices from "@/pages/invoices";
import Tasks from "@/pages/tasks";
import Messages from "@/pages/messages";
import PaymentSettings from "@/pages/settings/payment-settings";
import BookingEngineSettings from "@/pages/settings/booking-engine";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients" component={Clients} />
      <Route path="/staff" component={Staff} />
      <Route path="/proposals" component={Proposals} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/bookings/:id" component={BookingDetail} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/messages" component={Messages} />
      <Route path="/settings/payments" component={PaymentSettings} />
      <Route path="/settings/booking-engine" component={BookingEngineSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 bg-opacity-[0.06]">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white" />
                  <h1 className="text-xl font-bold text-white">Project Rainbow CRM</h1>
                </div>
              </header>
              <main className="flex-1 overflow-auto bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
