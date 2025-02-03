import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { PaymentList } from "@/components/payments/PaymentList";
import { PaymentStats } from "@/components/payments/PaymentStats";
import { supabase } from "@/integrations/supabase/client";

export default function Payments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['rent-payments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('payment_type', 'rent')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Calculate total collected and pending amounts for rent payments only
  const totalCollected = payments?.reduce((sum, payment) => 
    payment.status === 'completed' ? sum + Number(payment.amount) : sum, 0) || 0;

  const totalPending = payments?.reduce((sum, payment) => 
    payment.status === 'pending' ? sum + Number(payment.amount) : sum, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Rent Payments</h1>
        </div>
        <PaymentStats 
          totalCollected={totalCollected} 
          totalPending={totalPending} 
        />
        <PaymentList 
          payments={payments} 
          isLoading={isLoading}
          type="rent"
        />
      </div>
    </DashboardLayout>
  );
}