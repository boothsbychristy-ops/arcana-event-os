import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import EmbedFrame from '@/components/EmbedFrame';
import BackgroundPicker from '@/components/BackgroundPicker';
import AssetGrid from '@/components/AssetGrid';
import { FileImage, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';

interface Approval {
  id: string;
  title: string;
  description: string;
  status: string;
  draftUrl: string | null;
  assetsJson?: { items?: any[] };
  createdAt: string;
}

const approvalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
});

type ApprovalFormData = z.infer<typeof approvalFormSchema>;

export default function Approvals() {
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const { data: approvals, isLoading } = useQuery<Approval[]>({
    queryKey: ['/api/approvals'],
  });

  const createApprovalMutation = useMutation({
    mutationFn: (data: ApprovalFormData) => 
      apiRequest('POST', '/api/approvals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals'] });
      toast({
        title: 'Success',
        description: 'Approval request created successfully',
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create approval request',
        variant: 'destructive',
      });
    },
  });

  const addAssetMutation = useMutation({
    mutationFn: ({ approvalId, url, label }: { approvalId: string; url: string; label?: string }) =>
      apiRequest('POST', `/api/approvals/${approvalId}/assets`, { url, type: 'ai_background', label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approvals'] });
      toast({
        title: 'Asset Added',
        description: 'Background has been saved to approval',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save asset',
        variant: 'destructive',
      });
    },
  });

  const handleBackgroundSelect = (url: string) => {
    setSelectedBackground(url);
    if (selectedApprovalId) {
      addAssetMutation.mutate({ 
        approvalId: selectedApprovalId, 
        url, 
        label: 'AI Generated Background' 
      });
    } else {
      toast({
        title: 'No Approval Selected',
        description: 'Please select an approval to add this background to',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: ApprovalFormData) => {
    createApprovalMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle2 },
      feedback: { variant: 'outline', icon: XCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            Approvals Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage client approvals, select backgrounds, and collaborate on creative assets
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-approval">
              <Plus className="h-4 w-4 mr-2" />
              New Approval
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Approval Request</DialogTitle>
              <DialogDescription>
                Create a new approval request for client review
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Wedding Backdrop Design"
                          data-testid="input-approval-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe the approval request..."
                          rows={4}
                          data-testid="input-approval-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createApprovalMutation.isPending}
                    data-testid="button-create-approval"
                  >
                    {createApprovalMutation.isPending ? 'Creating...' : 'Create Approval'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Creative Libraries Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileImage className="h-5 w-5 text-primary" />
          Creative Libraries
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmbedFrame
            src="https://unsplash.com/s/photos/backdrop"
            title="Backdrop Inspiration"
          />
          <EmbedFrame
            src="https://unsplash.com/s/photos/event-design"
            title="Design Templates"
          />
        </div>
      </div>

      {/* AI Background Picker */}
      <div id="background">
        <h2 className="text-xl font-semibold mb-4">AI Background Generator</h2>
        <BackgroundPicker onSelect={handleBackgroundSelect} />
        {selectedBackground && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selected: <span className="text-foreground font-mono">{selectedBackground}</span>
            </p>
          </div>
        )}
      </div>

      {/* Approvals List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Client Approvals</h2>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading approvals...</div>
        ) : approvals && approvals.length > 0 ? (
          <div className="grid gap-4">
            {approvals.map((approval) => (
              <Card 
                key={approval.id} 
                data-testid={`card-approval-${approval.id}`}
                className={selectedApprovalId === approval.id ? 'ring-2 ring-primary' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{approval.title}</CardTitle>
                      <CardDescription className="mt-1">{approval.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={selectedApprovalId === approval.id ? 'default' : 'outline'}
                        onClick={() => setSelectedApprovalId(approval.id)}
                        data-testid={`button-select-approval-${approval.id}`}
                      >
                        {selectedApprovalId === approval.id ? 'Selected' : 'Select'}
                      </Button>
                      {getStatusBadge(approval.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approval.draftUrl && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img
                        src={approval.draftUrl}
                        alt={approval.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Asset Gallery */}
                  {approval.assetsJson?.items && approval.assetsJson.items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Assets</h4>
                      <AssetGrid items={approval.assetsJson.items} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileImage className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No approvals yet. Create your first approval to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
