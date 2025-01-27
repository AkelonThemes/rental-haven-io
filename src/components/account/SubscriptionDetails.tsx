import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ArrowRight, Check, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface SubscriptionDetailsProps {
  subscription: Tables<"subscriptions"> | null;
  isLoading: boolean;
  onUpgradeClick: () => void;
}

export const SubscriptionDetails = ({
  subscription,
  isLoading,
  onUpgradeClick,
}: SubscriptionDetailsProps) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Check className="w-4 h-4 text-green-500" />;
      case "canceled":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "trialing":
        return "secondary";
      case "canceled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      toast({
        title: "Error",
        description: "No active subscription found",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCancelling(true);
      const response = await supabase.functions.invoke('cancel-subscription', {
        method: 'POST',
        body: { subscriptionId: subscription.stripe_subscription_id }
      });

      if (response.error) throw response.error;

      // Invalidate and refetch subscription data
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });

      toast({
        title: "Success",
        description: "Your subscription has been cancelled",
      });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Subscription</h2>
        <div className="space-y-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Subscription</h2>
      {subscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-medium capitalize">
              {subscription.plan_type} Plan
            </span>
            <div className="flex items-center gap-1">
              {getStatusIcon(subscription.status)}
              <Badge variant={getBadgeVariant(subscription.status)}>
                {subscription.status}
              </Badge>
            </div>
          </div>
          {subscription.current_period_end && subscription.status === 'active' && (
            <div className="text-sm text-muted-foreground">
              Next billing date:{" "}
              {format(new Date(subscription.current_period_end), "PPP")}
            </div>
          )}
          {subscription.status === "active" && (
            <>
              <div className="text-sm text-muted-foreground">
                Subscription ID: {subscription.stripe_subscription_id}
              </div>
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            </>
          )}
          {subscription.status !== "active" && (
            <Button onClick={onUpgradeClick} className="mt-4">
              Upgrade Plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground">No active subscription</p>
          <Button onClick={onUpgradeClick}>
            Subscribe Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};
