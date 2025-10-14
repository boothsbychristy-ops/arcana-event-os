import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Messages() {
  const [audience, setAudience] = useState<"internal" | "client">("internal");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages", audience],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-messages-title">Messages</h1>
          <p className="text-muted-foreground">Communicate with clients and team</p>
        </div>
      </div>

      <Tabs value={audience} onValueChange={(v) => setAudience(v as "internal" | "client")}>
        <TabsList>
          <TabsTrigger value="internal" data-testid="tab-internal-messages">Internal</TabsTrigger>
          <TabsTrigger value="client" data-testid="tab-client-messages">Client</TabsTrigger>
        </TabsList>

        <TabsContent value={audience} className="mt-6">
          {messages?.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Start a conversation with {audience === "internal" ? "your team" : "clients"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 rounded-2xl">
                <CardHeader>
                  <CardTitle>Conversations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {messages?.map((msg: any) => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-lg hover-elevate cursor-pointer"
                      data-testid={`conversation-${msg.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={msg.sender?.avatarUrl} />
                          <AvatarFallback>{msg.sender?.fullName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{msg.sender?.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                        </div>
                        {!msg.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-2xl">
                <CardHeader>
                  <CardTitle>Message Thread</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-96 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">Select a conversation to view messages</p>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      className="flex-1 resize-none"
                      rows={3}
                      data-testid="input-message"
                    />
                    <Button size="icon" data-testid="button-send-message">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
