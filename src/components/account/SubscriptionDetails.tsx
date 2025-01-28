import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";
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

  // Check session on mount and refresh if needed
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        toast({
          title: "Session Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }
    };
    checkSession();
  }, [toast]);

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

      if (response.error) {
        console.error('Error cancelling subscription:', response.error);
        let errorMessage = 'Failed to cancel subscription. Please try again.';
        
        // Check if the error response contains a more specific message
        if (response.error.message && typeof response.error.message === 'string') {
          const errorData = JSON.parse(response.error.message);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Immediately invalidate the subscription query to refresh the data
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
      {subscription && subscription.status !== 'canceled' ? (
        <ActiveSubscription 
          subscription={subscription} 
          onCancelClick={handleCancelSubscription}
          isCancelling={isCancelling}
        />
      ) : (
        <NoSubscription onUpgradeClick={onUpgradeClick} />
      )}
    </Card>
  );
};