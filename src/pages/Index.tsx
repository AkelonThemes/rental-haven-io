import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import PropertyCard from "@/components/PropertyCard";
import { Plus } from "lucide-react";

const mockProperties = [
  {
    id: 1,
    address: "123 Main Street, Suite 101",
    tenants: 2,
    rentAmount: 2500,
    status: "occupied" as const,
  },
  {
    id: 2,
    address: "456 Park Avenue, Unit 3B",
    tenants: 0,
    rentAmount: 1800,
    status: "vacant" as const,
  },
  {
    id: 3,
    address: "789 Business Center, Office 205",
    tenants: 1,
    rentAmount: 3200,
    status: "maintenance" as const,
  },
];

const Index = () => {
  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Manage your real estate portfolio</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProperties.map((property) => (
          <PropertyCard
            key={property.id}
            address={property.address}
            tenants={property.tenants}
            rentAmount={property.rentAmount}
            status={property.status}
          />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Index;