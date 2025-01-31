import DashboardLayout from "@/components/DashboardLayout";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RentTrends } from "@/components/dashboard/RentTrends";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();

  // Fetch dashboard stats for the authenticated user
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No session found');
          throw new Error('Not authenticated');
        }

        console.log('Fetching properties for user:', session.user.id);
        // Get properties owned by the user
        const { data: properties, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', session.user.id);

        if (propertyError) {
          console.error('Property fetch error:', propertyError);
          throw propertyError;
        }

        console.log('Properties fetched:', properties);

        // Get tenants for the user's properties
        const { data: tenants, error: tenantError } = await supabase
          .from('tenants')
          .select(`
            *,
            properties!inner(owner_id)
          `)
          .eq('properties.owner_id', session.user.id);

        if (tenantError) {
          console.error('Tenant fetch error:', tenantError);
          throw tenantError;
        }

        console.log('Tenants fetched:', tenants);

        // Calculate statistics
        const propertyCount = properties?.length || 0;
        const tenantCount = tenants?.length || 0;
        const totalRent = tenants?.reduce((sum, tenant) => sum + (tenant.rent_amount || 0), 0) || 0;

        return {
          propertyCount,
          tenantCount,
          totalRent,
          properties,
          tenants
        };
      } catch (error: any) {
        console.error('Dashboard data fetch error:', error);
        toast({
          title: "Error fetching dashboard data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  if (error) {
    console.error('Dashboard render error:', error);
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load dashboard data. Please try again later.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Overview of your property portfolio
          </p>
        </div>
        
        <DashboardCards stats={stats} isLoading={isLoading} />
        
        <div className="grid gap-4">
          <RentTrends data={stats?.tenants} isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;