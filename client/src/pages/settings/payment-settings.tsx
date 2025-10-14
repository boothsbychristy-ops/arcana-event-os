import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, CreditCard } from "lucide-react";
import { SiStripe, SiSquare } from "react-icons/si";

export default function PaymentSettings() {
  const { data: processors, isLoading: processorsLoading } = useQuery({
    queryKey: ["/api/payment-settings"],
  });

  const { data: methods, isLoading: methodsLoading } = useQuery({
    queryKey: ["/api/payment-methods"],
  });

  const processorCards = [
    {
      id: "stripe",
      name: "Stripe",
      icon: SiStripe,
      description: "Accept cards, wallets, and more",
      color: "text-[#635bff]",
    },
    {
      id: "square",
      name: "Square",
      icon: SiSquare,
      description: "In-person and online payments",
      color: "text-[#000000]",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: CreditCard,
      description: "PayPal and credit card processing",
      color: "text-[#0070ba]",
    },
  ];

  if (processorsLoading || methodsLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-payment-settings-title">Payment Settings</h1>
        <p className="text-muted-foreground">Configure payment processors and methods</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Payment Processors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {processorCards.map((processor) => {
            const isConnected = processors?.find((p: any) => p.processor === processor.id)?.isConnected;
            
            return (
              <Card key={processor.id} className="rounded-2xl" data-testid={`card-processor-${processor.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <processor.icon className={`h-8 w-8 ${processor.color}`} />
                    {isConnected ? (
                      <CheckCircle className="h-5 w-5 text-status-confirmed" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="mt-4">{processor.name}</CardTitle>
                  <CardDescription>{processor.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant={isConnected ? "secondary" : "default"}
                    className="w-full"
                    data-testid={`button-${isConnected ? "disconnect" : "connect"}-${processor.id}`}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            {methods?.map((method: any) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 rounded-lg border"
                data-testid={`payment-method-${method.method}`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{method.displayName}</p>
                    {method.instructions && (
                      <p className="text-sm text-muted-foreground">{method.instructions}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={method.isEnabled ? "default" : "secondary"}>
                    {method.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
