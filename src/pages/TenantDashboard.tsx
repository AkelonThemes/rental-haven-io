import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  property: {
    address: string;
  } | null;
}

export default function TenantDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: latestPayments, isLoading, refetch } = useQuery({
    queryKey: ['tenant-latest-payments'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        // Get the tenant ID for the current user
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('profile_id', session.user.id)
          .maybeSingle();

        if (!tenant) return null;

        // Get the latest payments for this tenant
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
    refetchInterval: 5000, // Refetch every 5 seconds to check for status updates
  });

  const handlePaymentClick = async (payment: Payment) => {
    if (!payment.stripe_payment_id) {
      toast({
        title: "Payment Error",
        description: "No payment link available. Please contact your landlord.",
        variant: "destructive",
      });
      return;
    }

    // Open Stripe Checkout in a new tab
    window.open(`https://checkout.stripe.com/pay/${payment.stripe_payment_id}`, '_blank');
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

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Rental Payments</h2>
            </div>
          </div>

          {latestPayments && latestPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.property?.address}</TableCell>
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
                            onClick={() => handlePaymentClick(payment)}
                            disabled={!payment.stripe_payment_id}
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
          ) : (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
              <p className="mt-2 text-gray-500">
                You don't have any rental payments at the moment.
              </p>
            </div>
          )}
          
          <button
            onClick={() => navigate('/payments')}
            className="mt-4 text-primary hover:underline text-sm w-full text-center"
          >
            View All Payments
          </button>
        </Card>
      </div>
    </DashboardLayout>
  );
}