import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle2, User, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required"),
  packageId: z.string().optional(),
  notes: z.string().optional(),
  _company: z.string().optional(), // Honeypot field
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const steps = [
  { id: 1, name: "Contact", icon: User },
  { id: 2, name: "Event", icon: Calendar },
  { id: 3, name: "Package", icon: Package },
  { id: 4, name: "Review", icon: CheckCircle2 },
];

export default function Register() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      eventDate: "",
      packageId: "",
      notes: "",
      _company: "",
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setIsSubmitting(true);
      
      // For demo purposes, use a default owner ID
      // In production, this would come from subdomain/booking page context
      const ownerId = "1977ed4d-c954-4b75-9cd0-ed9d98b1cb70";

      // Exclude honeypot field from API payload
      const { _company, ...apiData } = data;
      
      const response = await fetch("/api/public/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...apiData,
          ownerId,
          honeypot: _company, // Send honeypot with backend-expected name
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Handle Zod validation errors array
        if (Array.isArray(error.error)) {
          const errorMessages = error.error.map((e: any) => e.message).join(", ");
          throw new Error(errorMessages || "Validation failed");
        }
        throw new Error(error.error || "Registration failed");
      }

      const result = await response.json();
      setSubmitted(true);
      
      toast({
        title: "Registration successful!",
        description: "We'll be in touch soon to discuss your event.",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fields = getStepFields(currentStep);
    const isValid = await form.trigger(fields);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStepFields = (step: number): (keyof RegistrationFormData)[] => {
    switch (step) {
      case 1:
        return ["firstName", "lastName", "email", "phone"];
      case 2:
        return ["eventDate"];
      case 3:
        return ["packageId"];
      default:
        return [];
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription>
              Your registration has been received. We'll review your information and contact you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Submit Another Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="h-12 w-full rounded-lg bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 opacity-10 mb-4" />
          <CardTitle className="text-2xl">Event Registration</CardTitle>
          <CardDescription>
            Tell us about your event and we'll create a custom proposal
          </CardDescription>
          
          {/* Stepper */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        currentStep >= step.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/25 text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="mt-2 text-xs font-medium hidden sm:block">{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 w-12 sm:w-20 transition-colors ${
                        currentStep > step.id ? "bg-primary" : "bg-muted-foreground/25"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Honeypot field - hidden from users */}
              <input
                type="text"
                {...form.register("_company")}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input data-testid="input-firstName" placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input data-testid="input-lastName" placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input data-testid="input-email" type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input data-testid="input-phone" type="tel" placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Event Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Event Details</h3>
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Input data-testid="input-eventDate" type="date" {...field} />
                        </FormControl>
                        <FormDescription>When is your event scheduled?</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="input-notes"
                            placeholder="Tell us more about your event..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Package Selection */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Package Preference (Optional)</h3>
                  <FormField
                    control={form.control}
                    name="packageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package</FormLabel>
                        <FormControl>
                          <Input data-testid="input-packageId" placeholder="e.g., Premium Photo Booth" {...field} />
                        </FormControl>
                        <FormDescription>
                          Let us know if you have a specific package in mind, or leave blank for a custom quote
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Review Your Information</h3>
                  <div className="space-y-3 rounded-lg border p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{form.watch("firstName")} {form.watch("lastName")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{form.watch("email")}</p>
                    </div>
                    {form.watch("phone") && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{form.watch("phone")}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Event Date</p>
                      <p className="font-medium">
                        {new Date(form.watch("eventDate")).toLocaleDateString()}
                      </p>
                    </div>
                    {form.watch("packageId") && (
                      <div>
                        <p className="text-sm text-muted-foreground">Package</p>
                        <p className="font-medium">{form.watch("packageId")}</p>
                      </div>
                    )}
                    {form.watch("notes") && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="font-medium">{form.watch("notes")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    data-testid="button-prev"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto"
                    data-testid="button-next"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-auto"
                    data-testid="button-submit"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Registration"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
