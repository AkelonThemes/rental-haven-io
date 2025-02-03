import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { PropertyCard } from "@/components/PropertyCard";

interface Property {
  id: string;
  address: string;
  city: string;
  province: string;
  zip_code: string;
  status: string;
  rent_amount: number;
}

const Properties = () => {
  const { toast } = useToast();

  const { data: properties = [], isError, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', session.session.user.id);

      if (error) {
        toast({
          title: "Error fetching properties",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Manage your rental properties</p>
        </div>
        <AddPropertyDialog />
      </div>

      {isError ? (
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load properties. Please try again later.</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-gray-600">No properties found. Add your first property to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Properties;