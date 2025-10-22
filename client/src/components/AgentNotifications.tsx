import { useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AgentNotificationLog } from "@shared/schema";
import { Bell } from "lucide-react";

export function AgentNotifications() {
  const { toast } = useToast();

  // Poll for unread notifications every 30 seconds
  const { data: notifications } = useQuery<AgentNotificationLog[]>({
    queryKey: ["/api/agent-notifications/unread"],
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
  });

  const dismissNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/agent-notifications/${id}/dismiss`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent-notifications/unread"] });
    },
  });

  const showNotification = useCallback((notification: AgentNotificationLog) => {
    // Parse action data to get the message
    let message = "You have a new notification";
    let title = "Agent Notification";

    try {
      const actionData = JSON.parse(notification.actionData);
      message = actionData.message || message;
      title = actionData.title || title;
    } catch (e) {
      // Use default messages if parsing fails
    }

    toast({
      title,
      description: message,
      duration: 10000, // Show for 10 seconds
      action: (
        <button
          className="text-sm font-medium"
          onClick={() => dismissNotificationMutation.mutate(notification.id)}
        >
          Dismiss
        </button>
      ),
    });
  }, [toast, dismissNotificationMutation]);

  // Show toast notifications for new unread notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      // Get IDs of notifications we've already shown
      const shownNotificationIds = JSON.parse(
        sessionStorage.getItem("shownNotifications") || "[]"
      ) as string[];

      // Filter out notifications we've already shown
      const newNotifications = notifications.filter(
        (n) => !shownNotificationIds.includes(n.id)
      );

      // Show each new notification
      newNotifications.forEach((notification) => {
        showNotification(notification);
        
        // Mark as shown
        shownNotificationIds.push(notification.id);
      });

      // Update session storage
      if (newNotifications.length > 0) {
        sessionStorage.setItem(
          "shownNotifications",
          JSON.stringify(shownNotificationIds)
        );
      }
    }
  }, [notifications, showNotification]);

  // This component doesn't render anything visible
  return null;
}
