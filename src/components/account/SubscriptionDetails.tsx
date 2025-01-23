import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ArrowRight, Check, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

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

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Subscription</h2>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      ) : subscription ? (
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
          {subscription.current_period_end && (
            <div className="text-sm text-muted-foreground">
              Next billing date:{" "}
              {format(new Date(subscription.current_period_end), "PPP")}
            </div>
          )}
          {subscription.status === "active" && (
            <div className="text-sm text-muted-foreground">
              Subscription ID: {subscription.stripe_subscription_id}
            </div>
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