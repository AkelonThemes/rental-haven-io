import DashboardLayout from "@/components/DashboardLayout";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RentTrends } from "@/components/dashboard/RentTrends";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { role } = useRole();

  // Redirect tenants to their dashboard
  if (role === 'tenant') {
    navigate('/tenant-dashboard');
    return null;
  }

  // Fetch dashboard stats for landlord
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Fetch properties owned by the landlord
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*, tenants(*)');

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        toast({
          title: "Error fetching properties",
          description: propertiesError.message,
          variant: "destructive",
        });
        throw propertiesError;
      }

      // Calculate total rent from all properties
      const totalRent = properties?.reduce((sum, property) => {
        return sum + Number(property.rent_amount || 0);
      }, 0) || 0;

      // Count unique tenants
      const tenantCount = properties?.reduce((count, property) => {
        return count + (property.tenants?.length || 0);
      }, 0) || 0;

      return {
        propertyCount: properties?.length || 0,
        tenantCount,
        totalRent
      };
    },
  });

  // Fetch rent trends data
  const { data: rentTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['rent-trends'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: tenants, error } = await supabase
        .from('tenants')
        .select(`
          *,
          properties(*)
        `)
        .order('lease_start_date', { ascending: true });

      if (error) {
        console.error('Error fetching rent trends:', error);
        toast({
          title: "Error fetching rent trends",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return tenants;
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
      </div>
      <div className="space-y-8">
        <DashboardCards stats={stats} isLoading={statsLoading} />
        <RentTrends data={rentTrends} isLoading={trendsLoading} />
      </div>
    </DashboardLayout>
  );
}