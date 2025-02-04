import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PaymentSection } from "@/components/tenant-dashboard/PaymentSection";

export default function TenantDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');

  const { data: latestPayments, isLoading, refetch } = useQuery({
    queryKey: ['tenant-latest-payments'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('profile_id', session.user.id)
          .maybeSingle();

        if (!tenant) return null;

        const { data: payments, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            status,
            payment_date,
            created_at,
            stripe_payment_id,
            rent_period_start,
            rent_period_end,
            property:properties(
              address
            )
          `)
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        return payments;
      } catch (error: any) {
        toast({
          title: "Error fetching payment data",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
  });

  // Show success toast when payment is completed
  useEffect(() => {
    if (success === 'true') {
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
        variant: "default",
      });
      // Clear the success parameter from URL
      navigate('/tenant-dashboard', { replace: true });
    }
  }, [success, toast, navigate]);

  // Subscribe to payment status changes
  useEffect(() => {
    if (!latestPayments?.length) return;

    const channel = supabase
      .channel('payment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `tenant_id=eq.${latestPayments[0]?.id}`,
        },
        (payload) => {
          console.log('Payment updated:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [latestPayments, refetch]);

  const handlePaymentClick = async (payment: any) => {
    if (!payment.id) {
      toast({
        title: "Payment Error",
        description: "Invalid payment information",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating payment session for payment ID:', payment.id);
      
      const { data, error } = await supabase.functions.invoke(
        'create-tenant-payment',
        {
          body: { payment_id: payment.id },
        }
      );

      if (error) throw error;
      
      console.log('Payment session response:', data);
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Could not process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          <h1 className="text-2xl font-bold">Tenant Dashboard</h1>
          <p className="text-gray-600">Welcome to your tenant portal</p>
        </div>

        <PaymentSection 
          payments={latestPayments} 
          onPaymentClick={handlePaymentClick}
        />
      </div>
    </DashboardLayout>
  );
}