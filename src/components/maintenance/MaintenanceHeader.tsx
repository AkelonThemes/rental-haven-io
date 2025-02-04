import { CreateMaintenanceRequestDialog } from "./CreateMaintenanceRequestDialog";

interface MaintenanceHeaderProps {
  tenantId: string;
  propertyId: string;
  onSuccess: () => void;
}

export function MaintenanceHeader({ tenantId, propertyId, onSuccess }: MaintenanceHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Maintenance Requests
        </h1>
        <p className="text-gray-600 mt-1">
          Submit and track maintenance requests for your property
        </p>
      </div>
      <CreateMaintenanceRequestDialog
        tenantId={tenantId}
        propertyId={propertyId}
        onSuccess={onSuccess}
      />
    </div>
  );
}