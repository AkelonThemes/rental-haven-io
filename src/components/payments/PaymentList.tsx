import { Receipt } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface PaymentListProps {
  payments: (Tables<"payments"> & {
    property: Tables<"properties"> | null;
  })[] | null;
  isLoading: boolean;
}

export function PaymentList({ payments, isLoading }: PaymentListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!payments?.length) {
    return (
      <div className="text-center py-8">
        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
        <p className="mt-2 text-gray-500">
          No payment records match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {payments.map((payment) => (
        <div key={payment.id} className="py-4 flex items-center justify-between">
          <div>
            <p className="font-medium">
              {payment.payment_type === 'rent' 
                ? `Rent Payment - ${payment.property?.address}`
                : 'Subscription Payment'
              }
            </p>
            <p className="text-sm text-gray-500">
              {new Date(payment.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span 
              className={`px-2 py-1 text-sm rounded-full ${
                payment.status === 'completed' 
                  ? 'bg-green-100 text-green-700'
                  : payment.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : payment.status === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {payment.status}
            </span>
            <span className="font-semibold">K{payment.amount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}