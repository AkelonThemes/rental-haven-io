import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PropertySummarySheetProps {
  propertyId: string;
  address: string;
}

export function PropertySummarySheet({ propertyId, address }: PropertySummarySheetProps) {
  const [open, setOpen] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['property-summary', propertyId],
    queryFn: async () => {
      // Get tenants count
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id')
        .eq('property_id', propertyId);

      if (tenantsError) throw tenantsError;

      // Get payments status
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('status')
        .eq('property_id', propertyId)
        .eq('payment_type', 'rent');

      if (paymentsError) throw paymentsError;

      const totalPayments = payments?.length || 0;
      const paidPayments = payments?.filter(p => p.status === 'completed')?.length || 0;

      return {
        totalTenants: tenants?.length || 0,
        paidPayments,
        outstandingPayments: totalPayments - paidPayments
      };
    },
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Property Summary - {address}</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <div className="grid gap-4">
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Tenants</p>
                <p className="text-2xl font-semibold">{summary?.totalTenants}</p>
              </div>
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Paid Rents</p>
                <p className="text-2xl font-semibold text-green-600">{summary?.paidPayments}</p>
              </div>
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Outstanding Payments</p>
                <p className="text-2xl font-semibold text-yellow-600">{summary?.outstandingPayments}</p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}