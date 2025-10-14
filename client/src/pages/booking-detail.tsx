import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, DollarSign, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BookingDetail() {
  const params = useParams();
  const bookingId = params.id;

  const { data: booking, isLoading } = useQuery({
    queryKey: ["/api/bookings", bookingId],
  });

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["/api/invoices/booking", bookingId],
  });

  if (isLoading || invoiceLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-status-confirmed";
      case "completed": return "bg-status-completed";
      case "canceled": return "bg-status-canceled";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className={`${getStatusColor(booking?.status)} text-white text-lg px-4 py-2`} data-testid="badge-booking-status">
            {booking?.status}
          </Badge>
          <h1 className="text-3xl font-bold" data-testid="text-booking-title">{booking?.title}</h1>
        </div>
        <Button data-testid="button-make-payment">
          <DollarSign className="h-4 w-4 mr-2" />
          Make Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
              <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
              <TabsTrigger value="invoice" data-testid="tab-invoice">Invoice</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Event Type</p>
                      <p className="font-medium">{booking?.eventType || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Guest Count</p>
                      <p className="font-medium">{booking?.guestCount || "Not specified"}</p>
                    </div>
                  </div>
                  {booking?.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="mt-1">{booking.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <Card className="rounded-2xl">
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">No tasks yet</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <Card className="rounded-2xl">
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">No messages yet</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoice" className="mt-4">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoice ? (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Invoice #</span>
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-bold text-lg">${parseFloat(invoice.total).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Paid</span>
                        <span className="font-medium">${parseFloat(invoice.amountPaid).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance</span>
                        <span className="font-bold text-status-expired">${parseFloat(invoice.balance).toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No invoice generated</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {new Date(booking?.startTime).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(booking?.startTime).toLocaleTimeString()} - {new Date(booking?.endTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Venue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  {booking?.venueName && <p className="font-medium">{booking.venueName}</p>}
                  {booking?.venueAddress && (
                    <p className="text-sm text-muted-foreground">
                      {booking.venueAddress}
                      {booking.venueCity && `, ${booking.venueCity}`}
                      {booking.venueState && `, ${booking.venueState}`}
                      {booking.venueZip && ` ${booking.venueZip}`}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Staff Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {booking?.staff?.length > 0 ? (
                <div className="space-y-3">
                  {booking.staff.map((staff: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={staff.avatarUrl} />
                        <AvatarFallback>{staff.name?.charAt(0) || "S"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{staff.name}</p>
                        <p className="text-xs text-muted-foreground">{staff.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No staff assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
