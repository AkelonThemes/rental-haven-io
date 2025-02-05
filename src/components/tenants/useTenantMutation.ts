import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { TenantFormSchema } from "./useTenantForm";
import { Property } from "./types";

interface UseTenantMutationProps {
  onSuccess: () => void;
  properties: Property[];
}

export function useTenantMutation({ onSuccess, properties }: UseTenantMutationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleTenantCreation = async (values: TenantFormSchema) => {
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

      if (functionData.error) {
        toast({
          title: "Cannot add tenant",
          description: functionData.error,
          variant: "destructive",
        });
        return;
      }

      if (functionData.password) {
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
            title: "Tenant added but email failed",
            description: "The tenant was created successfully but we couldn't send the welcome email. Please try resending it later.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Tenant added successfully and welcome email sent!",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Existing tenant added successfully to the property",
          variant: "default",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccess();
      
    } catch (error: any) {
      console.error('Error in tenant creation:', error);
      toast({
        title: "Error adding tenant",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { handleTenantCreation };
}