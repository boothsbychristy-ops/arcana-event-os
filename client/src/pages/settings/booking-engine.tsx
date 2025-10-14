import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export default function BookingEngineSettings() {
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/booking-engine-settings"],
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/booking-questions"],
  });

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ["/api/unavailable-notices"],
  });

  if (settingsLoading || questionsLoading || noticesLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-booking-engine-title">Booking Engine Settings</h1>
        <p className="text-muted-foreground">Configure your online booking experience</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="questions" data-testid="tab-questions">Questions</TabsTrigger>
          <TabsTrigger value="notices" data-testid="tab-notices">Notices</TabsTrigger>
          <TabsTrigger value="privacy" data-testid="tab-privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure booking approval and checkout options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approval</Label>
                  <p className="text-sm text-muted-foreground">Manual review before confirming bookings</p>
                </div>
                <Switch checked={settings?.requireApproval} data-testid="switch-require-approval" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Guest Checkout</Label>
                  <p className="text-sm text-muted-foreground">Let clients book without creating an account</p>
                </div>
                <Switch checked={settings?.allowGuestCheckout} data-testid="switch-guest-checkout" />
              </div>

              <div className="space-y-2">
                <Label>Minimum Advance Booking (Days)</Label>
                <Input
                  type="number"
                  defaultValue={settings?.minAdvanceBookingDays}
                  data-testid="input-min-advance"
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Advance Booking (Days)</Label>
                <Input
                  type="number"
                  defaultValue={settings?.maxAdvanceBookingDays}
                  data-testid="input-max-advance"
                />
              </div>

              <Button data-testid="button-save-general">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Booking Questions</CardTitle>
                  <CardDescription>Collect additional information from clients</CardDescription>
                </div>
                <Button data-testid="button-add-question">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No questions configured</p>
              ) : (
                <div className="space-y-3">
                  {questions?.map((question: any) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`question-${question.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{question.question}</p>
                        <p className="text-sm text-muted-foreground">Type: {question.fieldType}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {question.isRequired && (
                          <span className="text-xs text-status-expired">Required</span>
                        )}
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notices" className="mt-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Unavailable Notices</CardTitle>
                  <CardDescription>Block dates when you're not available</CardDescription>
                </div>
                <Button data-testid="button-add-notice">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Notice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notices?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No unavailable dates</p>
              ) : (
                <div className="space-y-3">
                  {notices?.map((notice: any) => (
                    <div
                      key={notice.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`notice-${notice.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{notice.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(notice.startDate).toLocaleDateString()} - {new Date(notice.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Privacy & Consent</CardTitle>
              <CardDescription>Manage privacy policies and data retention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cookie Consent</Label>
                  <p className="text-sm text-muted-foreground">Show cookie consent banner</p>
                </div>
                <Switch defaultChecked data-testid="switch-cookie-consent" />
              </div>

              <div className="space-y-2">
                <Label>Data Retention (Days)</Label>
                <Input
                  type="number"
                  defaultValue={365}
                  data-testid="input-data-retention"
                />
                <p className="text-sm text-muted-foreground">
                  How long to keep client data after account deletion
                </p>
              </div>

              <Button data-testid="button-save-privacy">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
