import { Receipt } from "lucide-react";

export function EmptyPaymentState() {
  return (
    <div className="text-center py-8">
      <Receipt className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
      <p className="mt-2 text-gray-500">
        You don't have any rental payments at the moment.
      </p>
    </div>
  );
}