import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function Bookings() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-status-confirmed";
      case "completed": return "bg-status-completed";
      case "canceled": return "bg-status-canceled";
      default: return "bg-gray-500";
    }
  };

  const filteredBookings = bookings?.filter((booking: any) =>
    booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.venueName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-bookings-title">Bookings</h1>
          <p className="text-muted-foreground">Manage your event bookings</p>
        </div>
        <Button data-testid="button-add-booking">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-bookings"
        />
      </div>

      {filteredBookings?.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Create your first booking to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings?.map((booking: any) => (
            <Link key={booking.id} href={`/bookings/${booking.id}`}>
              <Card className="rounded-2xl hover-elevate cursor-pointer h-full" data-testid={`card-booking-${booking.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex-1" data-testid={`text-booking-title-${booking.id}`}>{booking.title}</CardTitle>
                    <Badge className={`${getStatusColor(booking.status)} text-white ml-2`}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(booking.startTime).toLocaleDateString()}</span>
                  </div>
                  {booking.venueName && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.venueName}</span>
                    </div>
                  )}
                  {booking.staff?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {booking.staff.slice(0, 3).map((staff: any, idx: number) => (
                          <Avatar key={idx} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={staff.avatarUrl} />
                            <AvatarFallback>{staff.name?.charAt(0) || "S"}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {booking.staff.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{booking.staff.length - 3} more</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
