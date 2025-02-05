import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenantForm } from "./tenants/useTenantForm";
import { AddTenantDialogContent } from "./tenants/AddTenantDialogContent";
import { useTenantMutation } from "./tenants/useTenantMutation";

interface AddTenantDialogProps {
  propertyId?: string;
}

export function AddTenantDialog({ propertyId }: AddTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useTenantForm(propertyId);

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

  const { handleTenantCreation } = useTenantMutation({
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
    properties
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <AddTenantDialogContent
        form={form}
        properties={properties}
        onSubmit={handleTenantCreation}
      />
    </Dialog>
  );
}