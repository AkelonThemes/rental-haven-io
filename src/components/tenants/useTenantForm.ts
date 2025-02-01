import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  property_id: z.string().min(1, "Property is required"),
  lease_start_date: z.string().min(1, "Lease start date is required"),
  lease_end_date: z.string().min(1, "Lease end date is required"),
  rent_amount: z.string().min(1, "Rent amount is required"),
});

export function useTenantForm(propertyId?: string) {
  return useForm<z.infer<typeof formSchema>>({
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
}

export type TenantFormSchema = z.infer<typeof formSchema>;