import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, Calendar, CheckSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/dashboard/revenue"],
  });

  const { data: upcomingBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/dashboard/upcoming-bookings"],
  });

  if (isLoading || revenueLoading || bookingsLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const actionCounters = [
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString() || "0"}`,
      icon: DollarSign,
      color: "text-status-paid",
    },
    {
      title: "Active Proposals",
      value: stats?.activeProposals || "0",
      icon: FileText,
      color: "text-status-viewed",
    },
    {
      title: "Upcoming Bookings",
      value: stats?.upcomingBookings || "0",
      icon: Calendar,
      color: "text-status-confirmed",
    },
    {
      title: "Pending Tasks",
      value: stats?.pendingTasks || "0",
      icon: CheckSquare,
      color: "text-status-expired",
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your Event OS command center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actionCounters.map((counter) => (
          <Card key={counter.title} className="rounded-2xl hover-elevate" data-testid={`card-stat-${counter.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{counter.title}</CardTitle>
              <counter.icon className={`h-5 w-5 ${counter.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-stat-${counter.title.toLowerCase().replace(/\s+/g, "-")}`}>{counter.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingBookings?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming bookings</p>
            ) : (
              upcomingBookings?.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="flex items-start gap-3 pb-3 border-b last:border-0" data-testid={`booking-${booking.id}`}>
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm" data-testid={`text-booking-title-${booking.id}`}>{booking.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.startTime).toLocaleDateString()} • {booking.venueName}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
