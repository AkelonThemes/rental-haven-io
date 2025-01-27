import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SubscriptionLoading } from "./SubscriptionLoading";
import { ActiveSubscription } from "./ActiveSubscription";
import { NoSubscription } from "./NoSubscription";

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
    return <SubscriptionLoading />;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Subscription</h2>
      {subscription ? (
        subscription.status !== "active" ? (
          <div className="space-y-4">
            <ActiveSubscription 
              subscription={subscription} 
              onCancelClick={handleCancelSubscription}
              isCancelling={isCancelling}
            />
            <Button onClick={onUpgradeClick} className="mt-4">
              Upgrade Plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <ActiveSubscription 
            subscription={subscription} 
            onCancelClick={handleCancelSubscription}
            isCancelling={isCancelling}
          />
        )
      ) : (
        <NoSubscription onUpgradeClick={onUpgradeClick} />
      )}
    </Card>
  );
};