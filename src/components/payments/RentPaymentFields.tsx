import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentFormData } from "./types";

interface RentPaymentFieldsProps {
  form: UseFormReturn<PaymentFormData>;
}

interface Property {
  id: string;
  address: string;
}

interface Tenant {
  id: string;
  profile: {
    full_name: string | null;
  } | null;
}

export function RentPaymentFields({ form }: RentPaymentFieldsProps) {
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        window.location.href = '/auth';
        return [];
      }

      const { data, error } = await supabase
        .from('properties')
        .select('id, address');
      
      if (error) throw error;
      return data;
    }
  });

  const propertyId = form.watch('property_id');
  
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        window.location.href = '/auth';
        return [];
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('id, profile:profiles(full_name)')
        .eq('property_id', propertyId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId
  });

  return (
    <>
      <FormField
        control={form.control}
        name="property_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Property</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {propertyId && (
        <FormField
          control={form.control}
          name="tenant_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.profile?.full_name || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="rent_period_start"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Period Start</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="rent_period_end"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Period End</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}