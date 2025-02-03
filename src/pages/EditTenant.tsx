import React from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TenantFormFields } from "@/components/tenants/TenantFormFields";
import { useTenantForm } from "@/components/tenants/useTenantForm";

export default function EditTenant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useTenantForm();

  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          property_id,
          lease_start_date,
          lease_end_date,
          rent_amount,
          profiles (
            id,
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .select('id, address')
        .eq('owner_id', session.session.user.id);

      if (error) throw error;
      return data;
    },
  });

  React.useEffect(() => {
    if (tenant) {
      form.reset({
        full_name: tenant.profiles.full_name || '',
        property_id: tenant.property_id,
        lease_start_date: tenant.lease_start_date,
        lease_end_date: tenant.lease_end_date,
        rent_amount: tenant.rent_amount.toString(),
      });
    }
  }, [tenant, form]);

  const onSubmit = async (values: any) => {
    try {
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          property_id: values.property_id,
          lease_start_date: values.lease_start_date,
          lease_end_date: values.lease_end_date,
          rent_amount: parseFloat(values.rent_amount),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
        })
        .eq('id', tenant?.profiles?.id);

      if (profileError) throw profileError;

      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      
      toast({
        title: "Success",
        description: "Tenant updated successfully",
      });

      navigate('/tenants');
    } catch (error: any) {
      toast({
        title: "Error updating tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isTenantLoading) {
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
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
          <p className="text-gray-600 mt-1">Update tenant information</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TenantFormFields form={form} properties={properties} />
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tenants')}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}