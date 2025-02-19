import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceHeader } from "@/components/maintenance/MaintenanceHeader";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import { EmptyMaintenanceState } from "@/components/maintenance/EmptyMaintenanceState";
import { Wrench } from "lucide-react";

export default function TenantMaintenance() {
  const { toast } = useToast();

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("id, property_id")
        .eq("profile_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching tenant:", error);
        toast({
          title: "Error",
          description: "Failed to fetch tenant information",
          variant: "destructive",
        });
        throw error;
      }

      return tenant;
    },
  });

  const {
    data: requests = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["maintenance-requests", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];

      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching maintenance requests:", error);
        toast({
          title: "Error",
          description: "Failed to fetch maintenance requests",
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
    enabled: !!tenant,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <DashboardLayout>
        <div className="text-center py-8 space-y-4">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-gray-600">
            No tenant information found. Please contact your landlord.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 space-y-4">
        <MaintenanceHeader
          tenantId={tenant.id}
          propertyId={tenant.property_id}
          onSuccess={refetch}
        />
        {requests.length === 0 ? (
          <EmptyMaintenanceState />
        ) : (
          <MaintenanceRequestList requests={requests} />
        )}
      </div>
    </DashboardLayout>
  );
}