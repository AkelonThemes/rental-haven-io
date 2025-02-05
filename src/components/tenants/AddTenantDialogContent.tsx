import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TenantFormFields } from "./TenantFormFields";
import { Property } from "./types";
import { UseFormReturn } from "react-hook-form";
import { TenantFormSchema } from "./useTenantForm";

interface AddTenantDialogContentProps {
  form: UseFormReturn<TenantFormSchema>;
  properties: Property[];
  onSubmit: (values: TenantFormSchema) => Promise<void>;
}

export function AddTenantDialogContent({ form, properties, onSubmit }: AddTenantDialogContentProps) {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add New Tenant</DialogTitle>
        <DialogDescription>
          Add a new tenant to your property. If the email is already registered, 
          the existing user will be assigned as a tenant if they are not already a landlord.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TenantFormFields form={form} properties={properties} />
          <Button type="submit" className="w-full">Add Tenant</Button>
        </form>
      </Form>
    </DialogContent>
  );
}