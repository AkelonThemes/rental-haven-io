import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { PropertySummarySheet } from "@/components/PropertySummarySheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Property {
  id: string;
  address: string;
  city: string;
  province: string;
  zip_code: string;
  status: string;
  rent_amount: number;
  tenants: any[];
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
        .select('*, tenants(*)')
        .eq('owner_id', session.session.user.id);

      if (error) {
        toast({
          title: "Error fetching properties",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data.map(property => ({
        ...property,
        status: property.tenants && property.tenants.length > 0 ? 'occupied' : 'vacant'
      })) || [];
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Zip Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property: Property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">
                    {property.address}
                  </TableCell>
                  <TableCell>{property.city}</TableCell>
                  <TableCell>{property.province}</TableCell>
                  <TableCell>{property.zip_code}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.status === 'vacant' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {property.status}
                    </span>
                  </TableCell>
                  <TableCell>K{property.rent_amount}/month</TableCell>
                  <TableCell className="text-right">
                    <PropertySummarySheet propertyId={property.id} address={property.address} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Properties;