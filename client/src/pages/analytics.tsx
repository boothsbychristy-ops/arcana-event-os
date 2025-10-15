import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download, TrendingUp, DollarSign, Users, CheckCircle, Calendar as CalendarLucide, Target } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('month');
  const [datePreset, setDatePreset] = useState<string>('30days');

  const { data: summary, isLoading: summaryLoading } = useQuery<{
    revenue: number;
    bookings: number;
    avgBookingValue: number;
    conversionRate: number;
    taskCompletion: number;
    staffUtilization: number;
  }>({
    queryKey: ['/api/analytics/summary', dateRange.from.toISOString(), dateRange.to.toISOString()],
  });

  const { data: revenueSeries, isLoading: revenueLoading } = useQuery<Array<{ label: string; value: number }>>({
    queryKey: ['/api/analytics/revenue-series', interval, dateRange.from.toISOString(), dateRange.to.toISOString()],
  });

  const { data: staffPerformance, isLoading: staffLoading } = useQuery<Array<{ staffId: string; staffName: string; bookingsCount: number; tasksCompleted: number }>>({
    queryKey: ['/api/analytics/staff-performance', dateRange.from.toISOString(), dateRange.to.toISOString()],
  });

  const { data: statusDistribution, isLoading: statusLoading } = useQuery<Array<{ status: string; count: number }>>({
    queryKey: ['/api/analytics/status-distribution', dateRange.from.toISOString(), dateRange.to.toISOString()],
  });

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case '7days':
        setDateRange({ from: subDays(now, 7), to: now });
        setInterval('day');
        break;
      case '30days':
        setDateRange({ from: subDays(now, 30), to: now });
        setInterval('day');
        break;
      case 'thisMonth':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        setInterval('day');
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        setInterval('day');
        break;
      case '90days':
        setDateRange({ from: subDays(now, 90), to: now });
        setInterval('week');
        break;
      case 'thisYear':
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        setInterval('month');
        break;
    }
  };

  const handleExport = async (type: 'revenue' | 'staff' | 'tasks') => {
    const params = new URLSearchParams({
      type,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });
    
    const response = await fetch(`/api/analytics/export?${params}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Export failed:', response.statusText);
      return;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics & Reports</h1>
            <p className="text-muted-foreground">Track performance metrics and generate reports</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={datePreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-[180px]" data-testid="select-date-preset">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="thisYear">This year</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="button-custom-date-range">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                  ) : (
                    'Custom range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">From</p>
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">To</p>
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {summaryLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-revenue">
                  ${summary?.revenue?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <CalendarLucide className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-bookings">
                  {summary?.bookings || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-value">
                  ${summary?.avgBookingValue?.toFixed(2) || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-conversion">
                  {summary?.conversionRate?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-task-completion">
                  {summary?.taskCompletion?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Utilization</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-staff-util">
                  {summary?.staffUtilization?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2">
              <div>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Track revenue trends</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={interval} onValueChange={(v) => setInterval(v as any)}>
                  <SelectTrigger className="w-[120px]" data-testid="select-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleExport('revenue')}
                  data-testid="button-export-revenue"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueSeries || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" name="Revenue" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2">
              <div>
                <CardTitle>Staff Performance</CardTitle>
                <CardDescription>Bookings by staff member</CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleExport('staff')}
                data-testid="button-export-staff"
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={staffPerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="staffName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookingsCount" fill="hsl(var(--chart-1))" name="Bookings" />
                    <Bar dataKey="tasksCompleted" fill="hsl(var(--chart-2))" name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2">
              <div>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Breakdown of tasks by status</CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleExport('tasks')}
                data-testid="button-export-tasks"
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={100}
                      fill="hsl(var(--chart-1))"
                      dataKey="count"
                      nameKey="status"
                    >
                      {(statusDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
