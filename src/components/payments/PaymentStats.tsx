import { Card } from "@/components/ui/card";
import { DollarSign, ArrowUpDown } from "lucide-react";

interface PaymentStatsProps {
  totalCollected: number;
  totalPending: number;
}

export function PaymentStats({ totalCollected, totalPending }: PaymentStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-green-100 p-3">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Collected</p>
            <p className="text-2xl font-semibold">
              ${totalCollected.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-yellow-100 p-3">
            <ArrowUpDown className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-semibold">
              ${totalPending.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}