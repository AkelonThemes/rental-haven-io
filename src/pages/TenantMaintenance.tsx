import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateMaintenanceRequestDialog } from "@/components/maintenance/CreateMaintenanceRequestDialog";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { Wrench } from "lucide-react";

export default function TenantMaintenance() {
  const { toast } = useToast();

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return null;

      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("id, property_id")
        .eq("profile_id", session.session.user.id)
        .single();

      if (error) throw error;
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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Maintenance Requests
            </h1>
            <p className="text-gray-600 mt-1">
              Submit and track maintenance requests for your property
            </p>
          </div>
          {tenant && (
            <CreateMaintenanceRequestDialog
              tenantId={tenant.id}
              propertyId={tenant.property_id}
              onSuccess={refetch}
            />
          )}
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-600">
              No maintenance requests found. Create your first request to get
              started.
            </p>
          </div>
        ) : (
          <MaintenanceRequestList requests={requests} />
        )}
      </div>
    </DashboardLayout>
  );
}