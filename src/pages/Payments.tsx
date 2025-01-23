import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Receipt, DollarSign, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";

type PaymentType = 'all' | 'rent' | 'subscription';
type PaymentStatus = 'all' | 'pending' | 'completed' | 'failed' | 'refunded';

export default function Payments() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<PaymentType>('all');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>('all');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          property:properties(address)
        `);

      if (typeFilter !== 'all') {
        query = query.eq('payment_type', typeFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error fetching payments",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  const totalCollected = payments?.reduce((sum, p) => 
    sum + (p.status === 'completed' ? p.amount : 0), 0
  ) || 0;

  const totalPending = payments?.reduce((sum, p) => 
    sum + (p.status === 'pending' ? p.amount : 0), 0
  ) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <RecordPaymentDialog />
        </div>

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

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <div className="flex gap-2">
              <div className="mr-4">
                <Button 
                  variant={typeFilter === 'all' ? "default" : "ghost"}
                  onClick={() => setTypeFilter('all')}
                >
                  All Types
                </Button>
                <Button 
                  variant={typeFilter === 'rent' ? "default" : "ghost"}
                  onClick={() => setTypeFilter('rent')}
                >
                  Rent
                </Button>
                <Button 
                  variant={typeFilter === 'subscription' ? "default" : "ghost"}
                  onClick={() => setTypeFilter('subscription')}
                >
                  Subscription
                </Button>
              </div>
              <div>
                <Button 
                  variant={statusFilter === 'all' ? "default" : "ghost"}
                  onClick={() => setStatusFilter('all')}
                >
                  All Status
                </Button>
                <Button 
                  variant={statusFilter === 'pending' ? "default" : "ghost"}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </Button>
                <Button 
                  variant={statusFilter === 'completed' ? "default" : "ghost"}
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !payments?.length ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
              <p className="mt-2 text-gray-500">
                No payment records match your current filters.
              </p>
            </div>
          ) : (
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
                    <span className="font-semibold">${payment.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}