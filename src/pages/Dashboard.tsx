import DashboardLayout from "@/components/DashboardLayout";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RentTrends } from "@/components/dashboard/RentTrends";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";
import { PropertyCard } from "@/components/PropertyCard";

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { role } = useRole();

  // Redirect tenants to their dashboard
  if (role === 'tenant') {
    navigate('/tenant-dashboard');
    return null;
  }

  // Fetch properties and related data for landlord
  const { data: landlordData, isLoading: isLoadingData } = useQuery({
    queryKey: ['landlord-dashboard-data'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        console.log('Current user ID:', user.id);

        // Fetch properties with tenants in a single query
        const { data: propertiesWithTenants, error: queryError } = await supabase
          .from('properties')
          .select(`
            *,
            tenants (
              id,
              rent_amount,
              lease_start_date,
              lease_end_date,
              profiles (
                full_name,
                email
              )
            )
          `)
          .eq('owner_id', user.id);

        if (queryError) {
          console.error('Error fetching properties with tenants:', queryError);
          toast({
            title: "Error fetching properties",
            description: queryError.message,
            variant: "destructive",
          });
          throw queryError;
        }

        console.log('Raw properties with tenants data:', propertiesWithTenants);

        // Calculate dashboard stats
        const totalRent = propertiesWithTenants?.reduce((sum, property) => {
          const propertyRent = property.tenants?.reduce((tenantSum, tenant) => 
            tenantSum + Number(tenant.rent_amount || 0), 0) || 0;
          return sum + propertyRent;
        }, 0) || 0;

        const tenantCount = propertiesWithTenants?.reduce((count, property) => {
          return count + (property.tenants?.length || 0);
        }, 0) || 0;

        const processedData = {
          properties: propertiesWithTenants || [],
          stats: {
            propertyCount: propertiesWithTenants?.length || 0,
            tenantCount,
            totalRent
          }
        };

        console.log('Processed dashboard data:', processedData);
        return processedData;
      } catch (error: any) {
        console.error('Error in landlord dashboard query:', error);
        toast({
          title: "Error loading dashboard",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
        </div>
        <div className="space-y-8">
          <DashboardCards isLoading={true} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
      </div>
      <div className="space-y-8">
        <DashboardCards 
          stats={landlordData?.stats} 
          isLoading={isLoadingData} 
        />
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Properties</h2>
          {!landlordData?.properties || landlordData.properties.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No properties found. Add your first property to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {landlordData.properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>

        <RentTrends 
          data={landlordData?.properties.flatMap(p => p.tenants || [])} 
          isLoading={isLoadingData} 
        />
      </div>
    </DashboardLayout>
  );
}