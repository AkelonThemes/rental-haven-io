import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SubscriptionLoading = () => {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Subscription</h2>
      <div className="space-y-4">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </Card>
  );
};