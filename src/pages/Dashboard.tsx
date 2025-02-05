import DashboardLayout from "@/components/DashboardLayout";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RentTrends } from "@/components/dashboard/RentTrends";
import { TestEmailButton } from "@/components/TestEmailButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', session.user.id);

      const { data: tenants } = await supabase
        .from('tenants')
        .select(`
          *,
          property:properties(owner_id)
        `)
        .eq('property.owner_id', session.user.id);

      // Fetch all completed rent payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_type', 'rent')
        .eq('status', 'completed')
        .in('property_id', properties?.map(p => p.id) || []);
      
      const totalRent = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      
      return {
        propertyCount: properties?.length || 0,
        tenantCount: tenants?.length || 0,
        totalRent
      };
    }
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <TestEmailButton />
      </div>
      <div className="space-y-8">
        <DashboardCards stats={stats} isLoading={statsLoading} />
        <RentTrends />
      </div>
    </DashboardLayout>
  );
}