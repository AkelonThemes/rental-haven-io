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
import { useQueryClient } from "@tanstack/react-query";

interface AddTenantDialogProps {
  propertyId?: string;
}

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  property_id: z.string().min(1, "Property is required"),
  lease_start_date: z.string().min(1, "Lease start date is required"),
  lease_end_date: z.string().min(1, "Lease end date is required"),
  rent_amount: z.string().min(1, "Rent amount is required"),
});

export function AddTenantDialog({ propertyId }: AddTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      property_id: propertyId || "",
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
      console.log('Starting tenant creation process...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      console.log('Current user (landlord) session:', session.user.id);

      const property = properties.find(p => p.id === values.property_id);
      if (!property) throw new Error('Property not found');

      // Call the Edge Function with authentication token
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

      // Send welcome email with login credentials
      const { error: emailError } = await supabase.functions.invoke('send-tenant-welcome', {
        body: {
          tenantEmail: values.email,
          tenantName: values.full_name,
          propertyAddress: property.address,
          password: functionData.password // Pass the generated password to the email function
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

      // Invalidate queries to refresh UI
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
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