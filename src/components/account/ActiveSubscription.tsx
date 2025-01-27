import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

interface ActiveSubscriptionProps {
  subscription: Tables<"subscriptions">;
  onCancelClick: () => void;
  isCancelling: boolean;
}

export const ActiveSubscription = ({ 
  subscription, 
  onCancelClick, 
  isCancelling 
}: ActiveSubscriptionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        <span className="font-medium capitalize">
          {subscription.plan_type} Plan
        </span>
        <SubscriptionStatusBadge status={subscription.status} />
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
            onClick={onCancelClick}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel Subscription"}
          </Button>
        </>
      )}
    </div>
  );
};