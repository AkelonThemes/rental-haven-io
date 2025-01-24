import DashboardLayout from "@/components/DashboardLayout";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RentTrends } from "@/components/dashboard/RentTrends";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Overview of your property portfolio</p>
        </div>
        
        <DashboardCards />
        
        <div className="grid gap-4">
          <RentTrends />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;