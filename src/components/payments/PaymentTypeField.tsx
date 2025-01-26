import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { PaymentFormData } from "./types";

interface PaymentTypeFieldProps {
  form: UseFormReturn<PaymentFormData>;
}

export function PaymentTypeField({ form }: PaymentTypeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="payment_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payment Type</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}