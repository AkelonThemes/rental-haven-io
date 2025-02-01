import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { TenantFormFields } from "./tenants/TenantFormFields";
import { useTenantForm } from "./tenants/useTenantForm";
import { TenantFormSchema } from "./tenants/useTenantForm";

interface AddTenantDialogProps {
  propertyId?: string;
}

export function AddTenantDialog({ propertyId }: AddTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useTenantForm(propertyId);

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

  const onSubmit = async (values: TenantFormSchema) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const property = properties.find(p => p.id === values.property_id);
      if (!property) throw new Error('Property not found');

      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-tenant', {
        body: {
          tenantData: {
            ...values,
            created_by: session.user.id
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (functionError) throw functionError;
      if (!functionData) throw new Error('No response from function');

      const { error: emailError } = await supabase.functions.invoke('send-tenant-welcome', {
        body: {
          tenantEmail: values.email,
          tenantName: values.full_name,
          propertyAddress: property.address,
          password: functionData.password
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        toast({
          title: "Tenant created but email failed",
          description: "The tenant was created successfully but we couldn't send the welcome email.",
          variant: "destructive",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      setOpen(false);
      toast({
        title: "Success",
        description: "Tenant added successfully and welcome email sent",
      });
    } catch (error: any) {
      console.error('Error in tenant creation:', error);
      toast({
        title: "Error adding tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TenantFormFields form={form} properties={properties} />
            <Button type="submit" className="w-full">Add Tenant</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}