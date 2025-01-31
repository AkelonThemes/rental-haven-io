import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  created_at: string;
}

export default function TenantDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [latestPayment, setLatestPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestPayment() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: payment, error } = await supabase
          .from('payments')
          .select('id, amount, status, payment_date, created_at')
          .eq('payment_type', 'rent')
          .eq('tenant_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setLatestPayment(payment);
      } catch (error: any) {
        toast({
          title: "Error fetching payment data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLatestPayment();
  }, [toast]);

  if (loading) {
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

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Latest Payment</h2>
            </div>
          </div>

          {latestPayment ? (
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Rent Payment</p>
                  <p className="text-sm text-gray-500">
                    {latestPayment.payment_date 
                      ? `Paid on ${new Date(latestPayment.payment_date).toLocaleDateString()}`
                      : `Created on ${new Date(latestPayment.created_at).toLocaleDateString()}`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-sm rounded-full ${
                    latestPayment.status === 'completed' 
                      ? 'bg-green-100 text-green-700'
                      : latestPayment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : latestPayment.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {latestPayment.status}
                  </span>
                  <span className="font-semibold">K{latestPayment.amount}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/payments')}
                className="mt-4 text-primary hover:underline text-sm w-full text-center"
              >
                View All Payments
              </button>
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