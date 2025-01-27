import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileDetails } from "@/components/account/ProfileDetails";
import { SubscriptionDetails } from "@/components/account/SubscriptionDetails";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

const Account = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // Check for successful checkout
  useEffect(() => {
    if (sessionId) {
      toast({
        title: "Processing Subscription",
        description: "Please wait while we update your subscription...",
        variant: "default",
      });

      // After 3 seconds, show the success message
      const timer = setTimeout(() => {
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been successfully updated.",
          variant: "default",
        });
        // Remove the session_id from the URL
        navigate('/account', { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [sessionId, navigate, toast]);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return null;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      return profile;
    },
  });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription", sessionId], // Add sessionId to queryKey to trigger refetch
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select(`
          *,
          payments (
            amount,
            status,
            payment_date,
            stripe_payment_id
          )
        `)
        .eq("profile_id", profile.id)
        .maybeSingle();
      
      return subscription;
    },
    enabled: !!profile?.id,
    refetchInterval: sessionId ? 1000 : false, // Poll every second if we have a session_id
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleUpgradeClick = async () => {
    try {
      if (subscription?.status === 'active') {
        toast({
          title: "Subscription Active",
          description: "You already have an active subscription. Please manage your subscription from the billing portal.",
          variant: "default",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        method: 'POST',
      });
      
      if (error) {
        console.error('Error creating checkout session:', error);
        toast({
          title: "Error",
          description: "Failed to start checkout process. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="text-muted-foreground">
            Manage your account settings and subscription
          </p>
        </div>

        <div className="grid gap-6">
          <ProfileDetails profile={profile} />
          <SubscriptionDetails
            subscription={subscription}
            isLoading={isLoadingSubscription || isLoadingProfile}
            onUpgradeClick={handleUpgradeClick}
          />

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/payments"}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                View All Payments
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Account;