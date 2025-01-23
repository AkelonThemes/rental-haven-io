import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";
import { PaymentStats } from "@/components/payments/PaymentStats";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { PaymentList } from "@/components/payments/PaymentList";
import { Tables } from "@/integrations/supabase/types";

type PaymentType = 'all' | 'rent' | 'subscription';
type PaymentStatus = 'all' | 'pending' | 'completed' | 'failed' | 'refunded';

type PaymentWithProperty = Tables<"payments"> & {
  property: Tables<"properties"> | null;
};

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
          property:properties(*)
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

      return data as PaymentWithProperty[];
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

        <PaymentStats 
          totalCollected={totalCollected}
          totalPending={totalPending}
        />

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <PaymentFilters
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              setTypeFilter={setTypeFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>

          <PaymentList 
            payments={payments}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}