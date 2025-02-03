import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import { supabase } from "@/integrations/supabase/client";

export default function MaintenanceRequests() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['maintenance-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Maintenance Requests</h1>
      </div>
      <MaintenanceRequestList requests={requests || []} />
    </DashboardLayout>
  );
}