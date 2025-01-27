import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle } from "lucide-react";

interface SubscriptionStatusBadgeProps {
  status: string;
}

export const SubscriptionStatusBadge = ({ status }: SubscriptionStatusBadgeProps) => {
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
    <div className="flex items-center gap-1">
      {getStatusIcon(status)}
      <Badge variant={getBadgeVariant(status)}>
        {status}
      </Badge>
    </div>
  );
};