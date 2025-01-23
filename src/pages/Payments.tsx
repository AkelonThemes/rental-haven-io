import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Receipt, DollarSign, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Payment {
  id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  date: string;
  property: {
    address: string;
  };
}

const Payments = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Not authenticated");

      const { data: properties } = await supabase
        .from("properties")
        .select("id, address")
        .eq("owner_id", session.session.user.id);

      if (!properties) return [];

      // For now, return mock data based on actual properties
      return properties.map((property) => ({
        id: crypto.randomUUID(),
        amount: 1200,
        status: Math.random() > 0.5 ? "completed" : "pending",
        date: new Date().toISOString(),
        property: {
          address: property.address,
        },
      })) as Payment[];
    },
  });

  const filteredPayments = payments?.filter((payment) => 
    filter === "all" ? true : payment.status === filter
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <Button>
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Collected</p>
                <p className="text-2xl font-semibold">
                  ${payments?.reduce((sum, p) => sum + (p.status === "completed" ? p.amount : 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <ArrowUpDown className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-semibold">
                  ${payments?.reduce((sum, p) => sum + (p.status === "pending" ? p.amount : 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <div className="flex gap-2">
              <Button 
                variant={filter === "all" ? "default" : "ghost"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button 
                variant={filter === "pending" ? "default" : "ghost"}
                onClick={() => setFilter("pending")}
              >
                Pending
              </Button>
              <Button 
                variant={filter === "completed" ? "default" : "ghost"}
                onClick={() => setFilter("completed")}
              >
                Completed
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !filteredPayments?.length ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
              <p className="mt-2 text-gray-500">
                No payment records match your current filter.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{payment.property.address}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span 
                      className={`px-2 py-1 text-sm rounded-full ${
                        payment.status === "completed" 
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {payment.status}
                    </span>
                    <span className="font-semibold">${payment.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;