import { Card } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PaymentTable } from "./PaymentTable";
import { EmptyPaymentState } from "./EmptyPaymentState";

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  rent_period_start: string | null;
  rent_period_end: string | null;
  created_at: string;
  stripe_payment_id: string | null;
  property: {
    address: string;
  } | null;
}

interface PaymentSectionProps {
  payments: Payment[] | null;
  onPaymentClick: (payment: Payment) => void;
}

export function PaymentSection({ payments, onPaymentClick }: PaymentSectionProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Rental Payments</h2>
        </div>
      </div>

      {payments && payments.length > 0 ? (
        <PaymentTable payments={payments} onPaymentClick={onPaymentClick} />
      ) : (
        <EmptyPaymentState />
      )}
      
      <button
        onClick={() => navigate('/tenant-payments')}
        className="mt-4 text-primary hover:underline text-sm w-full text-center"
      >
        View All Payments
      </button>
    </Card>
  );
}