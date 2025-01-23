import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Package, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Account = () => {
  const { toast } = useToast();
  
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      return profile;
    },
  });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
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
        .eq("profile_id", profile?.id)
        .maybeSingle();
      
      return subscription;
    },
    enabled: !!profile?.id,
  });

  const handleUpgradeClick = async () => {
    try {
      // Check if user already has an active subscription
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
        let errorMessage = "Failed to start checkout process. Please try again.";
        
        if (error.message?.includes("Customer already has an active subscription")) {
          errorMessage = "You already have an active subscription. Please manage your subscription from the billing portal.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
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

  const getPlanBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'warning';
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
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
          {/* Profile Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-base">{profile?.full_name || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company</label>
                <p className="text-base">{profile?.company_name || "Not set"}</p>
              </div>
            </div>
          </Card>

          {/* Subscription Section */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Subscription</h2>
            {isLoadingSubscription ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            ) : subscription ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-medium capitalize">{subscription.plan_type} Plan</span>
                  <Badge variant={getPlanBadgeVariant(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
                {subscription.current_period_end && (
                  <div className="text-sm text-muted-foreground">
                    Next billing date: {format(new Date(subscription.current_period_end), "PPP")}
                  </div>
                )}
                {subscription.status === 'active' && (
                  <div className="text-sm text-muted-foreground">
                    Subscription ID: {subscription.stripe_subscription_id}
                  </div>
                )}
                {subscription.status !== "active" && (
                  <Button onClick={handleUpgradeClick} className="mt-4">
                    Upgrade Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">No active subscription</p>
                <Button onClick={handleUpgradeClick}>
                  Subscribe Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* Payment History */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            <div className="space-y-4">
              <Button variant="outline" onClick={() => window.location.href = "/payments"}>
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