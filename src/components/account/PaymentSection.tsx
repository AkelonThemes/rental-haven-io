import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { PaymentList } from "@/components/payments/PaymentList";

interface PaymentSectionProps {
  profile: Tables<"profiles"> | null;
}

export const PaymentSection = ({ profile }: PaymentSectionProps) => {
  const navigate = useNavigate();

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          property:properties(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      return data;
    },
    enabled: !!profile?.id,
  });

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Payment History</h2>
      <div className="space-y-4">
        <PaymentList 
          payments={payments} 
          isLoading={isLoadingPayments} 
        />
        <Button
          variant="outline"
          onClick={() => navigate("/payments")}
          className="mt-4"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          View All Payments
        </Button>
      </div>
    </Card>
  );
};