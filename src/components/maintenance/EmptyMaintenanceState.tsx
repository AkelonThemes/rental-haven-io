import { Wrench } from "lucide-react";

export function EmptyMaintenanceState() {
  return (
    <div className="text-center py-8 space-y-4">
      <Wrench className="w-12 h-12 text-gray-400 mx-auto" />
      <p className="text-gray-600">
        No maintenance requests found. Create your first request to get started.
      </p>
    </div>
  );
}