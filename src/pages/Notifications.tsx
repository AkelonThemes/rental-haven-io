import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          toast({
            title: "Error",
            description: "You must be logged in to view notifications",
            variant: "destructive",
          });
          return;
        }

        // Fetch notifications logic will go here once we create the notifications table
        setNotifications([
          {
            id: "1",
            title: "Rent Payment Due",
            message: "Rent payment for 123 Main St is due in 5 days",
            created_at: new Date().toISOString(),
            read: false,
          },
          {
            id: "2",
            title: "New Tenant Application",
            message: "You have a new tenant application for review",
            created_at: new Date().toISOString(),
            read: true,
          },
        ]);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <BellOff className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
            <p className="mt-2 text-gray-500">
              You're all caught up! Check back later for new notifications.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-colors ${
                  notification.read ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-full p-2 ${
                      notification.read
                        ? "bg-gray-100"
                        : "bg-primary-50 text-primary-600"
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <p className="mt-1 text-gray-600">{notification.message}</p>
                    <p className="mt-2 text-sm text-gray-400">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;