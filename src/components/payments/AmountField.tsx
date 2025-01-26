import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from "./types";

interface AmountFieldProps {
  form: UseFormReturn<PaymentFormData>;
}

export function AmountField({ form }: AmountFieldProps) {
  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Amount</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder="Enter amount"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}