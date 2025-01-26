import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentTypeField } from "./payments/PaymentTypeField";
import { AmountField } from "./payments/AmountField";
import { RentPaymentFields } from "./payments/RentPaymentFields";
import { PaymentFormData } from "./payments/types";

export function RecordPaymentDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const form = useForm<PaymentFormData>();

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          ...data,
          amount: Number(data.amount),
          status: 'pending',
        }]);

      if (error) throw error;

      toast({
        title: "Payment recorded",
        description: "The payment has been successfully recorded.",
      });

      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <DollarSign className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record New Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PaymentTypeField form={form} />
            <AmountField form={form} />
            {form.watch('payment_type') === 'rent' && (
              <RentPaymentFields form={form} />
            )}
            <Button type="submit" className="w-full">
              Record Payment
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}