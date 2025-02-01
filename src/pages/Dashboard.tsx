import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { RentTrends } from "@/components/dashboard/RentTrends";
import { TestEmailButton } from "@/components/TestEmailButton";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <TestEmailButton />
      </div>
      <div className="space-y-8">
        <DashboardCards />
        <RentTrends />
      </div>
    </DashboardLayout>
  );
}