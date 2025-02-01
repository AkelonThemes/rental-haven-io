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
      const { data: properties } = await supabase.from('properties').select('*');
      const { data: tenants } = await supabase.from('tenants').select('*');
      
      return {
        propertyCount: properties?.length || 0,
        tenantCount: tenants?.length || 0,
        totalRent: tenants?.reduce((sum, tenant) => sum + (tenant.rent_amount || 0), 0) || 0
      };
    }
  });

  // Fetch rent trends data
  const { data: rentTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['rent-trends'],
    queryFn: async () => {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('*')
        .order('lease_start_date', { ascending: true });
      return tenants;
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
        <RentTrends data={rentTrends} isLoading={trendsLoading} />
      </div>
    </DashboardLayout>
  );
}