import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentList } from "@/components/payments/PaymentList";

export function PaymentSection() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('payment_type', 'subscription')
        .eq('payer_profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Payment History</h2>
      <PaymentList 
        payments={payments} 
        isLoading={isLoading}
        type="subscription"
      />
    </Card>
  );
}