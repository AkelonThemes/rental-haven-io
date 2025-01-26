import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Mail, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddTenantDialog } from "@/components/AddTenantDialog";

interface Tenant {
  id: string;
  profile: {
    full_name: string;
  };
  property: {
    address: string;
  };
  lease_start_date: string;
  lease_end_date: string;
  rent_amount: number;
}

const Tenants = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const { data: tenants = [], isError } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          profile:profiles(full_name),
          property:properties(address),
          lease_start_date,
          lease_end_date,
          rent_amount
        `)
        .eq('properties.owner_id', session.session.user.id);

      if (error) {
        toast({
          title: "Error fetching tenants",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as Tenant[];
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600 mt-1">Manage your property tenants</p>
        </div>
        <AddTenantDialog />
      </div>

      {isError ? (
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load tenants. Please try again later.</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No tenants found. Add your first tenant to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-primary-50 rounded-full p-3">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{tenant.profile.full_name}</h3>
                  <p className="text-sm text-gray-500">{tenant.property.address}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {new Date(tenant.lease_start_date).toLocaleDateString()} - {new Date(tenant.lease_end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>${tenant.rent_amount}/month</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Tenants;