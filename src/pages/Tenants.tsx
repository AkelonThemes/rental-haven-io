import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddTenantDialog } from "@/components/AddTenantDialog";
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
  profile: {
    full_name: string | null;
  } | null;
  property: {
    address: string;
  } | null;
  lease_start_date: string;
  lease_end_date: string;
  rent_amount: number;
}

const Tenants = () => {
  const { toast } = useToast();

  const { data: tenants = [], isError, refetch, isLoading } = useQuery({
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
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000,
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
                <TableHead className="text-right">Rent Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    {tenant.profile?.full_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {tenant.property?.address || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.lease_start_date).toLocaleDateString()} - {new Date(tenant.lease_end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">${tenant.rent_amount}/month</TableCell>
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