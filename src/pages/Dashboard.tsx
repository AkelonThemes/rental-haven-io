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
        console.log('Starting to fetch dashboard data...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.error('No session found');
          throw new Error('Not authenticated');
        }

        console.log('Session found, user ID:', session.user.id);

        // Get properties owned by the user
        const { data: properties, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', session.user.id);

        if (propertyError) {
          console.error('Property fetch error:', propertyError);
          throw propertyError;
        }

        console.log('Properties fetched:', properties?.length || 0, 'properties found');

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

        console.log('Tenants fetched:', tenants?.length || 0, 'tenants found');

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
          title: "Error loading dashboard",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  // Show error state
  if (error) {
    console.error('Dashboard render error:', error);
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 md:space-y-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Loading your property portfolio...
            </p>
          </div>
          <DashboardCards isLoading={true} />
          <RentTrends isLoading={true} />
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