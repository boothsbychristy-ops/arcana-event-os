import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, AlertCircle, Send } from "lucide-react";

export default function ApprovalPublic() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    
    (async () => {
      try {
        const res = await fetch(`/api/approvals/public/${token}`);
        if (res.ok) {
          const approval = await res.json();
          setData(approval);
        } else {
          const error = await res.json();
          setError(error.error?.message || "This link is invalid or expired.");
        }
      } catch (err) {
        setError("Failed to load approval. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function handleStatusUpdate(status: "approved" | "feedback") {
    setSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const res = await fetch(`/api/approvals/public/${token}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status,
          feedback: status === "feedback" ? feedback : undefined
        }),
      });
      
      if (res.ok) {
        const result = await res.json();
        setSubmitStatus('success');
        setData({ ...data, status });
        
        // Show success message
        setTimeout(() => {
          setSubmitStatus(null);
        }, 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading approval...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>Invalid Approval Link</CardTitle>
            <CardDescription className="text-destructive">
              {error || "This approval link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              If you believe this is an error, please contact the sender for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAlreadyDecided = data.status === "approved" || data.status === "rejected";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-2">Approval Request</h1>
          <p className="text-muted-foreground">Review and provide your feedback</p>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <Alert className="bg-green-500/10 border-green-500/50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              Thank you! Your response has been recorded successfully.
            </AlertDescription>
          </Alert>
        )}
        
        {submitStatus === 'error' && (
          <Alert className="bg-destructive/10 border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to submit your response. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{data.title}</CardTitle>
                <CardDescription>{data.description}</CardDescription>
              </div>
              <StatusBadge status={data.status} />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Preview Image */}
            {data.draftUrl && (
              <div className="rounded-lg overflow-hidden border bg-muted">
                <img 
                  src={data.draftUrl} 
                  alt={data.title}
                  className="w-full h-auto"
                  data-testid="image-draft-preview"
                />
              </div>
            )}
            
            {/* Assets */}
            {data.assetsJson && Object.keys(data.assetsJson).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Additional Assets</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(data.assetsJson, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!isAlreadyDecided ? (
              <>
                {/* Feedback Text Area */}
                <div className="space-y-2">
                  <label htmlFor="feedback" className="text-sm font-medium">
                    Comments or Feedback (Optional)
                  </label>
                  <Textarea
                    id="feedback"
                    placeholder="Share any specific feedback or changes you'd like..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[100px]"
                    disabled={submitting}
                    data-testid="textarea-feedback"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    variant="default"
                    onClick={() => handleStatusUpdate("approved")}
                    disabled={submitting}
                    className="w-full"
                    data-testid="button-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {submitting ? "Processing..." : "Approve"}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleStatusUpdate("feedback")}
                    disabled={submitting || !feedback.trim()}
                    className="w-full"
                    data-testid="button-request-changes"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Processing..." : "Request Changes"}
                  </Button>
                </div>

                {!feedback.trim() && (
                  <p className="text-xs text-center text-muted-foreground">
                    Add comments above to enable "Request Changes" button
                  </p>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This approval has already been {data.status}. No further action is needed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-8">
          <p>Powered by Rainbow CRM • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/50';
      case 'feedback': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/50';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/50';
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor()}`}>
      {getStatusIcon()}
      <span className="capitalize">{status.replace('_', ' ')}</span>
    </div>
  );
}