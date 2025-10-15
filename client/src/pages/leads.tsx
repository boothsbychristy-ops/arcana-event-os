import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Calendar } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  eventDate: string | null;
  packageId: string | null;
  notes: string | null;
  status: "new" | "qualified" | "converted" | "archived";
  createdAt: string;
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  qualified: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  converted: "bg-green-500/10 text-green-500 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function Leads() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const convertMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await apiRequest(
        "PATCH",
        `/api/leads/${leadId}`,
        { action: "convert" }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Lead converted successfully!",
        description: "Client and proposal have been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || lead.email.toLowerCase().includes(search);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Manage event registration inquiries
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Leads</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading leads...
            </div>
          ) : !filteredLeads || filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                    <TableCell className="font-medium">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone || "—"}</TableCell>
                    <TableCell>
                      {lead.eventDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(lead.eventDate).toLocaleDateString()}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[lead.status]}
                        data-testid={`status-${lead.id}`}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {lead.status !== "converted" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => convertMutation.mutate(lead.id)}
                          disabled={convertMutation.isPending}
                          data-testid={`button-convert-${lead.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Convert to Client
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
