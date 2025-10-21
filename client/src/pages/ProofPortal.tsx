import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  MessageCircle, 
  Check, 
  X, 
  Download, 
  Clock, 
  FileText,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  Eye,
  RotateCw,
  Send,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Proof, ProofComment } from "@shared/schema";

export default function ProofPortal() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch project proofs
  const { data: proofs = [], isLoading: proofsLoading } = useQuery<Proof[]>({
    queryKey: ['/api/proofs', projectId],
    enabled: !!projectId,
  });

  // Fetch comments for selected proof
  const { data: comments = [] } = useQuery<ProofComment[]>({
    queryKey: ['/api/proof-comments', selectedProof],
    enabled: !!selectedProof,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { proofId: string; message: string }) => {
      return apiRequest('/api/proof-comments', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proof-comments'] });
      setCommentText("");
      toast({
        title: "Comment added",
        description: "Your feedback has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update proof status mutation
  const updateProofMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      return apiRequest(`/api/proofs/${data.id}`, 'PATCH', { status: data.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proofs'] });
      toast({
        title: "Status updated",
        description: "The proof status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentProof = proofs.find(p => p.id === selectedProof);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "secondary";
      case 'approved': return "default";
      case 'changes_requested': return "outline";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-3 w-3" />;
      case 'changes_requested': return <RotateCw className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (proofsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading proofs...</p>
        </div>
      </div>
    );
  }

  if (!proofs.length) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="glass-card">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No proofs are available for review at this time. Your project manager will notify you when proofs are ready.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FileText className="h-4 w-4" />
            <span>Design Proof Portal</span>
            <ChevronRight className="h-3 w-3" />
            <span>Project {projectId}</span>
          </div>
          <h1 className="text-2xl font-bold">Review & Approve Designs</h1>
          <p className="text-muted-foreground mt-1">
            Review design proofs and provide feedback to your creative team
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Proof List */}
          <div className="lg:col-span-1">
            <Card className="glass-card sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Design Proofs
                  <Badge variant="secondary">{proofs.length}</Badge>
                </CardTitle>
                <CardDescription>Select a proof to review</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="p-4 space-y-2">
                    {proofs.map((proof) => (
                      <button
                        key={proof.id}
                        onClick={() => setSelectedProof(proof.id)}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          selectedProof === proof.id 
                            ? 'glass-card border-primary/50 neon-glow' 
                            : 'glass hover-elevate'
                        }`}
                        data-testid={`button-proof-${proof.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium">{proof.title}</div>
                          <Badge variant={getStatusColor(proof.status)} className="scale-90">
                            {getStatusIcon(proof.status)}
                            <span className="ml-1">{proof.status.replace(/_/g, ' ')}</span>
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(proof.createdAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Proof Details */}
          {currentProof ? (
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{currentProof.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Uploaded {format(new Date(currentProof.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(currentProof.status)} className="text-sm">
                      {getStatusIcon(currentProof.status)}
                      <span className="ml-1">{currentProof.status.replace(/_/g, ' ')}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="preview" className="space-y-4">
                    <TabsList className="grid grid-cols-3 w-full glass">
                      <TabsTrigger value="preview" data-testid="tab-preview">Preview</TabsTrigger>
                      <TabsTrigger value="feedback" data-testid="tab-feedback">
                        Feedback
                        {comments.length > 0 && (
                          <Badge variant="secondary" className="ml-2 scale-75">
                            {comments.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="actions" data-testid="tab-actions">Actions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="space-y-4">
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center glass">
                        <div className="text-center space-y-4">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-muted-foreground">Design preview would be displayed here</p>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download Original
                          </Button>
                        </div>
                      </div>
                      
                      {currentProof.clientComment && (
                        <Alert className="glass">
                          <AlertDescription>
                            <strong>Designer Notes:</strong> {currentProof.clientComment}
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="feedback" className="space-y-4">
                      <div className="space-y-4">
                        {/* Comment Form */}
                        <div className="glass rounded-lg p-4">
                          <Textarea
                            placeholder="Share your feedback on this design..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="min-h-[100px] mb-3"
                            data-testid="textarea-comment"
                          />
                          <Button
                            onClick={() => currentProof && addCommentMutation.mutate({
                              proofId: currentProof.id,
                              message: commentText,
                            })}
                            disabled={!commentText.trim() || addCommentMutation.isPending}
                            data-testid="button-add-comment"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {addCommentMutation.isPending ? "Sending..." : "Send Feedback"}
                          </Button>
                        </div>

                        <Separator />

                        {/* Comments List */}
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4 pr-4">
                            {comments.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No comments yet. Be the first to provide feedback!</p>
                              </div>
                            ) : (
                              comments.map((comment) => (
                                <div key={comment.id} className="glass rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src="" />
                                      <AvatarFallback>
                                        <User className="h-4 w-4" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">
                                          {comment.author}
                                        </span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-muted-foreground">
                                          {format(new Date(comment.createdAt), "MMM dd 'at' h:mm a")}
                                        </span>
                                      </div>
                                      <p className="text-sm">{comment.message}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>

                    <TabsContent value="actions" className="space-y-4">
                      <Card className="glass">
                        <CardHeader>
                          <CardTitle>Review Actions</CardTitle>
                          <CardDescription>
                            Make a decision on this design proof
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button
                            className="w-full justify-start neon-glow"
                            variant="default"
                            onClick={() => updateProofMutation.mutate({
                              id: currentProof.id,
                              status: 'approved'
                            })}
                            disabled={currentProof.status === 'approved'}
                            data-testid="button-approve"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve This Design
                          </Button>
                          <Button
                            className="w-full justify-start"
                            variant="outline"
                            onClick={() => updateProofMutation.mutate({
                              id: currentProof.id,
                              status: 'revision_requested'
                            })}
                            disabled={currentProof.status === 'revision_requested'}
                            data-testid="button-request-revision"
                          >
                            <RotateCw className="h-4 w-4 mr-2" />
                            Request Revisions
                          </Button>
                          <Button
                            className="w-full justify-start"
                            variant="destructive"
                            onClick={() => updateProofMutation.mutate({
                              id: currentProof.id,
                              status: 'rejected'
                            })}
                            disabled={currentProof.status === 'rejected'}
                            data-testid="button-reject"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject This Design
                          </Button>
                        </CardContent>
                      </Card>

                      <Alert className="glass">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Once you approve a design, your creative team will proceed with production. 
                          Make sure to review thoroughly and provide clear feedback if revisions are needed.
                        </AlertDescription>
                      </Alert>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardContent className="py-16">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a proof from the list to begin reviewing</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}