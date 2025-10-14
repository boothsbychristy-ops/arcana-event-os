import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Error Loading Data", 
  message = "Something went wrong. Please try again.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="default" className="w-full" data-testid="button-retry">
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
