import { Card } from "@/components/ui/card";
import { Building2, Users, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardCardsProps {
  stats?: {
    propertyCount: number;
    tenantCount: number;
    totalRent: number;
  };
  isLoading: boolean;
}

export function DashboardCards({ stats, isLoading }: DashboardCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="p-4 md:p-6">
          <Skeleton className="h-20" />
        </Card>
        <Card className="p-4 md:p-6">
          <Skeleton className="h-20" />
        </Card>
        <Card className="p-4 md:p-6">
          <Skeleton className="h-20" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-blue-100 p-3">
            <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Properties</p>
            <p className="text-lg md:text-2xl font-semibold">{stats?.propertyCount || 0}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-green-100 p-3">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tenants</p>
            <p className="text-lg md:text-2xl font-semibold">{stats?.tenantCount || 0}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-yellow-100 p-3">
            <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Monthly Rent</p>
            <p className="text-lg md:text-2xl font-semibold">K{stats?.totalRent.toLocaleString() || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}