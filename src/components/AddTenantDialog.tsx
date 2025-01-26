import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  property_id: z.string().min(1, "Property is required"),
  lease_start_date: z.string().min(1, "Lease start date is required"),
  lease_end_date: z.string().min(1, "Lease end date is required"),
  rent_amount: z.string().min(1, "Rent amount is required"),
});

export function AddTenantDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      property_id: "",
      lease_start_date: "",
      lease_end_date: "",
      rent_amount: "",
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // First create a profile for the tenant
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            full_name: values.full_name,
            role: 'tenant'
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // Then create the tenant record
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert([
          {
            property_id: values.property_id,
            profile_id: profileData.id,
            lease_start_date: values.lease_start_date,
            lease_end_date: values.lease_end_date,
            rent_amount: parseFloat(values.rent_amount),
          }
        ]);

      if (tenantError) throw tenantError;

      toast({
        title: "Success",
        description: "Tenant added successfully",
      });

      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
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
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
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
            <FormField
              control={form.control}
              name="lease_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lease Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lease_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lease End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rent_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Add Tenant</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}