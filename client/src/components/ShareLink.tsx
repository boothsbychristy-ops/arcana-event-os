import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Link2, Clock, Eye, Check, ChevronDown, Calendar } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ShareLinkProps {
  approvalId: string;
  shareToken: string;
  shareExpiresAt?: Date | string | null;
  viewsCount?: number;
  lastViewedAt?: Date | string | null;
}

export function ShareLink({ approvalId, shareToken, shareExpiresAt, viewsCount = 0, lastViewedAt }: ShareLinkProps) {
  const [showCopied, setShowCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/public/approval/${shareToken}`;
  
  // Set expiry mutation
  const setExpiryMutation = useMutation({
    mutationFn: async (expiresIn: string | null) => {
      return apiRequest(`/api/approvals/${approvalId}/share`, {
        method: 'PATCH',
        body: JSON.stringify({ expiresIn })
      });
    },
    onSuccess: () => {
      toast({
        title: "Link expiry updated",
        description: "The share link expiry has been set successfully"
      });
    }
  });
  
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
    
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard"
    });
  };
  
  const formatExpiry = (date: Date | string | null | undefined) => {
    if (!date) return 'Never expires';
    const d = new Date(date);
    const now = new Date();
    
    if (d < now) return 'Expired';
    
    const hours = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `Expires in ${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days <= 7) return `Expires in ${days}d`;
    
    return `Expires ${format(d, 'MMM d')}`;
  };
  
  const formatLastViewed = (date: Date | string | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    
    const mins = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
    if (mins < 60) return `${mins}m ago`;
    
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return format(d, 'MMM d, h:mm a');
  };
  
  return (
    <div className="space-y-3">
      {/* Copy Link with Dropdown */}
      <div className="flex gap-2">
        <Button
          onClick={copyLink}
          variant="outline"
          className="flex-1 gap-2"
          data-testid="button-copy-link"
        >
          {showCopied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              Copy Link
            </>
          )}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" data-testid="button-expiry-menu">
              <Clock className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Set Link Expiry
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setExpiryMutation.mutate('24h')}
              data-testid="expiry-24h"
            >
              <Clock className="h-4 w-4 mr-2" />
              24 hours
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setExpiryMutation.mutate('7d')}
              data-testid="expiry-7d"
            >
              <Calendar className="h-4 w-4 mr-2" />
              7 days
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                const customDate = new Date();
                customDate.setDate(customDate.getDate() + 30);
                setExpiryMutation.mutate(customDate.toISOString());
              }}
              data-testid="expiry-30d"
            >
              <Calendar className="h-4 w-4 mr-2" />
              30 days
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setExpiryMutation.mutate(null)}
              data-testid="expiry-never"
            >
              Never expire
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* View Receipt */}
      {(viewsCount > 0 || shareExpiresAt) && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {viewsCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Viewed {viewsCount}×
                    {lastViewedAt && (
                      <span className="text-muted-foreground ml-1">
                        • last {formatLastViewed(lastViewedAt)}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
            
            {shareExpiresAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={new Date(shareExpiresAt) < new Date() ? 'text-destructive' : ''}>
                  {formatExpiry(shareExpiresAt)}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}