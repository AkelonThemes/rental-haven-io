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
import { PaymentList } from "@/components/payments/PaymentList";

const Account = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      toast({
        title: "Processing Subscription",
        description: "Please wait while we update your subscription...",
        variant: "default",
      });

      // After 3 seconds, show the success message and refetch data
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

  // Fetch profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        navigate("/auth");
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }
      
      return profile;
    },
    retry: false,
  });

  // Fetch subscription data with automatic refetching
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription", sessionId], // Add sessionId to trigger refetch
    queryFn: async () => {
      if (!profile?.id) return null;

      console.log('Fetching subscription for profile:', profile.id);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("profile_id", profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Subscription error:', error);
        throw error;
      }

      console.log('Subscription data:', data);
      return data;
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

  // Add payment history query
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          property:properties(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5); // Only show the 5 most recent payments

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      return data;
    },
    enabled: !!profile?.id,
  });

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
              <PaymentList 
                payments={payments} 
                isLoading={isLoadingPayments} 
              />
              <Button
                variant="outline"
                onClick={() => navigate("/payments")}
                className="mt-4"
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
