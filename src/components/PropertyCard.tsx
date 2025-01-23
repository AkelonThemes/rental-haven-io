import { Card } from "@/components/ui/card";
import { Building2, Users, DollarSign } from "lucide-react";

interface PropertyCardProps {
  address: string;
  tenants: number;
  rentAmount: number;
  status: "occupied" | "vacant" | "maintenance";
}

const PropertyCard = ({ address, tenants, rentAmount, status }: PropertyCardProps) => {
  const statusColors = {
    occupied: "bg-green-100 text-green-800",
    vacant: "bg-red-100 text-red-800",
    maintenance: "bg-yellow-100 text-yellow-800",
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="w-10 h-10 text-primary-600" />
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{address}</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-sm ${statusColors[status]} mt-1`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-500" />
          <span className="text-gray-600">{tenants} Tenants</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-gray-500" />
          <span className="text-gray-600">{rentAmount}K/month</span>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;