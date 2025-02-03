import DashboardLayout from "@/components/DashboardLayout";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";

export default function MaintenanceRequests() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Maintenance Requests</h1>
      </div>
      <MaintenanceRequestList />
    </DashboardLayout>
  );
}