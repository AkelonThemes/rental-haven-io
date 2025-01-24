import { Card } from "@/components/ui/card";
import { Building2, Users, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function DashboardCards() {
  const { data: propertyCount = 0 } = useQuery({
    queryKey: ['propertyCount'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated session');

      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', session.user.id);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: tenantCount = 0 } = useQuery({
    queryKey: ['tenantCount'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated session');

      const { count, error } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .in('property_id', (
          supabase
            .from('properties')
            .select('id')
            .eq('owner_id', session.user.id)
        ));
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalRent = 0 } = useQuery({
    queryKey: ['totalRent'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated session');

      const { data, error } = await supabase
        .from('properties')
        .select('rent_amount')
        .eq('owner_id', session.user.id);
      
      if (error) throw error;
      return data.reduce((sum, property) => sum + (property.rent_amount || 0), 0);
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-blue-100 p-3">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Properties</p>
            <p className="text-2xl font-semibold">{propertyCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-green-100 p-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Tenants</p>
            <p className="text-2xl font-semibold">{tenantCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-yellow-100 p-3">
            <DollarSign className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Rent</p>
            <p className="text-2xl font-semibold">${totalRent.toLocaleString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}