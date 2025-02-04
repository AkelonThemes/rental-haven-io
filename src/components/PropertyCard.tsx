import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { Home, Users, DollarSign } from "lucide-react";
import { AddTenantDialog } from "./AddTenantDialog";
import { CreatePaymentLinkDialog } from "./payments/CreatePaymentLinkDialog";

interface PropertyCardProps {
  property: Tables<"properties">;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">{property.address}</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">{property.city}, {property.province} {property.zip_code}</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Tenants</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">K{property.rent_amount}/month</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <AddTenantDialog propertyId={property.id} />
        </div>
      </div>
    </Card>
  );
}