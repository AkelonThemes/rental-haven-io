import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Home, Receipt, Wrench, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TenantProperty {
  id: string;
  address: string;
  rent_amount: number;
  lease_start_date: string;
  lease_end_date: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function TenantDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [property, setProperty] = useState<TenantProperty | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenantData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch tenant's property
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select(`
            property_id,
            lease_start_date,
            lease_end_date,
            rent_amount,
            property:properties(
              id,
              address
            )
          `)
          .eq('profile_id', session.user.id)
          .single();

        if (tenantError) throw tenantError;

        if (tenantData) {
          setProperty({
            id: tenantData.property.id,
            address: tenantData.property.address,
            rent_amount: tenantData.rent_amount,
            lease_start_date: tenantData.lease_start_date,
            lease_end_date: tenantData.lease_end_date,
          });

          // Fetch maintenance requests
          const { data: requests, error: requestsError } = await supabase
            .from('maintenance_requests')
            .select('*')
            .eq('property_id', tenantData.property.id)
            .order('created_at', { ascending: false });

          if (requestsError) throw requestsError;
          setMaintenanceRequests(requests);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching tenant data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTenantData();
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

        {property ? (
          <>
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Your Residence</h2>
                  </div>
                  <p className="mt-2 text-gray-600">{property.address}</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      Lease Period: {new Date(property.lease_start_date).toLocaleDateString()} - {new Date(property.lease_end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Monthly Rent: K{property.rent_amount}
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/maintenance/new')}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Request Maintenance
                </Button>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Recent Payments</h2>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/payments')}
                >
                  View All Payments
                </Button>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Maintenance Requests</h2>
                </div>
                {maintenanceRequests.length > 0 ? (
                  <div className="space-y-4">
                    {maintenanceRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-sm rounded-full ${
                          request.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : request.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center">No maintenance requests</p>
                )}
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold">No Property Associated</h3>
                <p className="text-gray-600">Please contact your property manager to set up your account.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}