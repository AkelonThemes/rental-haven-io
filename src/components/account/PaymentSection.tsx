import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentList } from "@/components/payments/PaymentList";
import { Tables } from "@/integrations/supabase/types";

interface PaymentSectionProps {
  profile: Tables<"profiles"> | null;
}

export function PaymentSection({ profile }: PaymentSectionProps) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('payment_type', 'subscription')
        .eq('payer_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
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