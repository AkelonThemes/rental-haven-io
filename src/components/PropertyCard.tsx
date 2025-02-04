import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { Home, Users, DollarSign } from "lucide-react";
import { AddTenantDialog } from "./AddTenantDialog";
import { CreatePaymentLinkDialog } from "./payments/CreatePaymentLinkDialog";

interface PropertyCardProps {
  property: Tables<"properties"> & {
    tenants?: Array<{
      id: string;
      rent_amount: number;
      lease_start_date: string;
      lease_end_date: string;
      profiles?: {
        full_name: string | null;
        email: string | null;
      } | null;
    }>;
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const tenantCount = property.tenants?.length || 0;
  const totalRent = property.tenants?.reduce((sum, tenant) => sum + Number(tenant.rent_amount), 0) || 0;

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
              <span className="text-sm text-gray-500">{tenantCount} Tenant{tenantCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">K{totalRent}/month</span>
            </div>
          </div>
          {property.tenants && property.tenants.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Current Tenants:</h4>
              <div className="space-y-2">
                {property.tenants.map((tenant) => (
                  <div key={tenant.id} className="text-sm text-gray-600">
                    {tenant.profiles?.full_name || 'Unnamed Tenant'} - K{tenant.rent_amount}/month
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <AddTenantDialog propertyId={property.id} />
          <CreatePaymentLinkDialog propertyId={property.id} />
        </div>
      </div>
    </Card>
  );
}