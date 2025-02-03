import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  zip_code: z.string().min(1, "ZIP code is required"),
  rent_amount: z.number().min(0, "Rent amount must be positive"),
});

type FormData = z.infer<typeof formSchema>;

interface EditPropertyFormProps {
  propertyId: string;
}

export function EditPropertyForm({ propertyId }: EditPropertyFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      city: "",
      province: "",
      zip_code: "",
      rent_amount: 0,
    },
  });

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) {
        toast({
          title: "Error fetching property",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  useEffect(() => {
    if (property) {
      form.reset({
        address: property.address,
        city: property.city,
        province: property.province,
        zip_code: property.zip_code,
        rent_amount: property.rent_amount,
      });
    }
  }, [property, form]);

  async function onSubmit(data: FormData) {
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          address: data.address,
          city: data.city,
          province: data.province,
          zip_code: data.zip_code,
          rent_amount: data.rent_amount,
        })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property updated successfully",
      });

      navigate('/properties');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="province"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="zip_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rent_amount"
          render={({ field: { onChange, ...field }}) => (
            <FormItem>
              <FormLabel>Rent Amount (K)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  onChange={(e) => onChange(parseFloat(e.target.value))}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/properties')}
          >
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}