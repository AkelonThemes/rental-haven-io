import DashboardLayout from "@/components/DashboardLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Pencil, Trash2, Eye, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddTenantDialog } from "@/components/AddTenantDialog";
import { TenantSummarySheet } from "@/components/TenantSummarySheet";
import { CreatePaymentLinkDialog } from "@/components/payments/CreatePaymentLinkDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Tenant {
  id: string;
  profile_id: string;
  property_id: string;
  lease_start_date: string;
  lease_end_date: string;
  rent_amount: number;
  profiles: {
    id: string;
    full_name: string | null;
  };
  properties: {
    id: string;
    address: string;
  };
}

const Tenants = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tenants = [], isError, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];

      const { data, error } = await supabase
        .from("tenants")
        .select(`
          id,
          profile_id,
          property_id,
          lease_start_date,
          lease_end_date,
          rent_amount,
          profiles (
            id,
            full_name
          ),
          properties (
            id,
            address
          )
        `)
        .eq("properties.owner_id", session.session.user.id);

      if (error) {
        toast({
          title: "Error fetching tenants",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
  });

  const handleDelete = async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600 mt-1">Manage your property tenants</p>
        </div>
        <AddTenantDialog />
      </div>

      {isError ? (
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load tenants. Please try again later.</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <Users className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-gray-600">No tenants found. Add your first tenant to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Property Address</TableHead>
                <TableHead>Lease Period</TableHead>
                <TableHead>Rent Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant: Tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    {tenant.profiles?.full_name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {tenant.properties?.address || "N/A"}
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.lease_start_date).toLocaleDateString()} -{" "}
                    {new Date(tenant.lease_end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>K{tenant.rent_amount}/month</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <CreatePaymentLinkDialog 
                          propertyId={tenant.property_id} 
                          tenantId={tenant.id}
                        >
                          <CreditCard className="h-4 w-4" />
                        </CreatePaymentLinkDialog>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`/tenants/${tenant.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the tenant
                              and remove their data from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(tenant.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <TenantSummarySheet 
                          tenantId={tenant.id} 
                          fullName={tenant.profiles?.full_name || "N/A"}
                        >
                          <Eye className="h-4 w-4" />
                        </TenantSummarySheet>
                      </Button>
                    </div>
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

export default Tenants;