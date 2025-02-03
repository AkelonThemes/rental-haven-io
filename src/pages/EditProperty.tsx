import { useParams, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { EditPropertyForm } from "@/components/EditPropertyForm";

const EditProperty = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/properties" replace />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Property</h1>
        <div className="max-w-2xl mx-auto">
          <EditPropertyForm propertyId={id} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditProperty;