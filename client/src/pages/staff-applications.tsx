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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Check, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface StaffApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  experience: string | null;
  portfolio: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface ApprovalResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  staff: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  temporaryPassword: string;
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function StaffApplications() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    password?: string;
    email?: string;
  }>({ open: false });

  const { data: applications, isLoading } = useQuery<StaffApplication[]>({
    queryKey: ["/api/staff-applications"],
  });

  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await fetch(
        `/api/staff-applications/${applicationId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Approval failed");
      }

      return response.json() as Promise<ApprovalResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setApprovalDialog({
        open: true,
        password: data.temporaryPassword,
        email: data.user.email,
      });
      toast({
        title: "Staff application approved!",
        description: "User and staff records have been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await fetch(
        `/api/staff-applications/${applicationId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Rejection failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-applications"] });
      toast({
        title: "Application rejected",
        description: "The staff application has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredApplications = applications?.filter((app) => {
    const fullName = `${app.firstName} ${app.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || app.email.toLowerCase().includes(search);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Applications</h1>
          <p className="text-muted-foreground">
            Review and approve staff applications
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Applications</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                placeholder="Search applications..."
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
              Loading applications...
            </div>
          ) : !filteredApplications || filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                    <TableCell className="font-medium">
                      {app.firstName} {app.lastName}
                    </TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.phone || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {app.experience || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[app.status]}
                        data-testid={`status-${app.id}`}
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {app.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveMutation.mutate(app.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${app.id}`}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(app.id)}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${app.id}`}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={approvalDialog.open}
        onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}
      >
        <DialogContent data-testid="dialog-approval">
          <DialogHeader>
            <DialogTitle>Staff Account Created</DialogTitle>
            <DialogDescription>
              The staff member has been approved and their account has been created.
              Please share the temporary password with them securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm">
                {approvalDialog.email}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Temporary Password</label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm break-all" data-testid="text-temp-password">
                {approvalDialog.password}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The staff member should change this password after their first login.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
