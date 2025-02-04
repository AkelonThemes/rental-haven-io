import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  rent_period_start: string | null;
  rent_period_end: string | null;
  created_at: string;
  stripe_payment_id: string | null;
}

interface PaymentTableProps {
  payments: Payment[];
  onPaymentClick: (payment: Payment) => void;
}

export function PaymentTable({ payments, onPaymentClick }: PaymentTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {payment.rent_period_start && payment.rent_period_end ? (
                  `${new Date(payment.rent_period_start).toLocaleDateString()} - ${new Date(payment.rent_period_end).toLocaleDateString()}`
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell className="font-semibold">K{payment.amount}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-sm rounded-full ${
                  payment.status === 'completed' 
                    ? 'bg-green-100 text-green-700'
                    : payment.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : payment.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {payment.status}
                </span>
              </TableCell>
              <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {payment.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPaymentClick(payment)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Pay Now
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}