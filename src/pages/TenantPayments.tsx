import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  rent_period_start: string | null;
  rent_period_end: string | null;
  created_at: string;
  property: {
    address: string;
  } | null;
}

export default function TenantPayments() {
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['tenant-payments'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session found');

        const { data: payments, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            status,
            payment_date,
            rent_period_start,
            rent_period_end,
            created_at,
            property:properties (
              address
            )
          `)
          .eq('payment_type', 'rent')
          .eq('tenant_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return payments;
      } catch (error: any) {
        toast({
          title: "Error fetching payments",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rental Payments</h1>
          <p className="text-gray-600">View your rental payment history</p>
        </div>

        <Card className="p-6">
          {payments && payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">
                      {payment.property?.address || 'Unknown Property'}
                      {payment.rent_period_start && payment.rent_period_end && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({new Date(payment.rent_period_start).toLocaleDateString()} - {new Date(payment.rent_period_end).toLocaleDateString()})
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.payment_date 
                        ? `Paid on ${new Date(payment.payment_date).toLocaleDateString()}`
                        : `Created on ${new Date(payment.created_at).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
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
                    <span className="font-semibold">K{payment.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
              <p className="mt-2 text-gray-500">
                You don't have any rental payments recorded yet.
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}