import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface NoSubscriptionProps {
  onUpgradeClick: () => void;
}

export const NoSubscription = ({ onUpgradeClick }: NoSubscriptionProps) => {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">No active subscription</p>
      <Button onClick={onUpgradeClick}>
        Subscribe Now
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};