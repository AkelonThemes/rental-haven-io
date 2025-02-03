import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddTenantDialog } from "@/components/AddTenantDialog";
import { TenantSummarySheet } from "@/components/TenantSummarySheet";
import { CreatePaymentLinkDialog } from "@/components/payments/CreatePaymentLinkDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Tenant {
  id: string;
  profile_id: string;
  property_id: string;
  lease_start_date: string;
  lease_end_date: string;
  rent_amount: number;
  profiles: {
    id: string;
    full_name: string | null;
  };
  properties: {
    id: string;
    address: string;
  };
}

const Tenants = () => {
  const { toast } = useToast();

  const { data: tenants = [], isError, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];

      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          profile_id,
          property_id,
          lease_start_date,
          lease_end_date,
          rent_amount,
          profiles (
            id,
            full_name
          ),
          properties (
            id,
            address
          )
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

      return data || [];
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

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
        <div className="text-center py-8 space-y-4">
          <Users className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-gray-600">No tenants found. Add your first tenant to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Property Address</TableHead>
                <TableHead>Lease Period</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant: Tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    {tenant.profiles?.full_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {tenant.properties?.address || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.lease_start_date).toLocaleDateString()} - {new Date(tenant.lease_end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>K{tenant.rent_amount}/month</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <CreatePaymentLinkDialog 
                        propertyId={tenant.property_id} 
                        tenantId={tenant.id}
                      />
                      <TenantSummarySheet 
                        tenantId={tenant.id} 
                        fullName={tenant.profiles?.full_name || 'N/A'} 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Tenants;