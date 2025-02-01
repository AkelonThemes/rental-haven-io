import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PaymentLinkFormData {
  amount: number;
  tenant_id: string;
  property_id: string;
  rent_period_start: string;
  rent_period_end: string;
}

export function CreatePaymentLinkDialog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<PaymentLinkFormData>();

  // Fetch tenants for the property
  const { data: tenants } = useQuery({
    queryKey: ['tenants', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          profile:profiles(full_name)
        `)
        .eq('property_id', propertyId);

      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
  });

  const onSubmit = async (data: PaymentLinkFormData) => {
    try {
      // Create a payment record with pending status
      const { error } = await supabase
        .from('payments')
        .insert([{
          amount: Number(data.amount),
          payment_type: 'rent',
          status: 'pending',
          property_id: propertyId,
          tenant_id: data.tenant_id,
          rent_period_start: data.rent_period_start,
          rent_period_end: data.rent_period_end,
        }]);

      if (error) throw error;

      toast({
        title: "Payment link created",
        description: "The payment link has been created and will be shared with the tenant.",
      });

      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast({
        title: "Error",
        description: "Failed to create payment link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Link className="mr-2 h-4 w-4" />
          Create Payment Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <select
                    {...field}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Select tenant</option>
                    {tenants?.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.profile?.full_name || 'Unnamed Tenant'}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rent_period_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period Start</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Create Payment Link
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}