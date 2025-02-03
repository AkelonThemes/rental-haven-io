import DashboardLayout from "@/components/DashboardLayout";
import { PaymentList } from "@/components/payments/PaymentList";
import { PaymentStats } from "@/components/payments/PaymentStats";

export default function Payments() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Payments</h1>
        </div>
        <PaymentStats />
        <PaymentList />
      </div>
    </DashboardLayout>
  );
}