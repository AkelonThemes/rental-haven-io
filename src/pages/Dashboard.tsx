import DashboardLayout from "@/components/DashboardLayout";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RentTrends } from "@/components/dashboard/RentTrends";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your property portfolio</p>
        </div>
        
        <DashboardCards />
        
        <div className="grid gap-4 md:grid-cols-1">
          <RentTrends />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;