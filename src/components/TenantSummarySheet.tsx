import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TenantSummarySheetProps {
  tenantId: string;
  fullName: string;
}

export function TenantSummarySheet({ tenantId, fullName }: TenantSummarySheetProps) {
  const [open, setOpen] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['tenant-summary', tenantId],
    queryFn: async () => {
      const { data: tenantDetails, error: tenantError } = await supabase
        .from('tenants')
        .select(`
          id,
          rent_amount,
          profiles (
            email,
            full_name
          ),
          properties (
            address,
            city,
            province,
            zip_code
          )
        `)
        .eq('id', tenantId)
        .single();

      if (tenantError) throw tenantError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status, payment_date, rent_period_start, rent_period_end')
        .eq('tenant_id', tenantId)
        .eq('payment_type', 'rent');

      if (paymentsError) throw paymentsError;

      const totalPayments = payments?.length || 0;
      const paidPayments = payments?.filter(p => p.status === 'completed')?.length || 0;
      const totalPaidAmount = payments
        ?.filter(p => p.status === 'completed')
        ?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      return {
        email: tenantDetails.profiles.email,
        propertyAddress: `${tenantDetails.properties.address}, ${tenantDetails.properties.city}, ${tenantDetails.properties.province} ${tenantDetails.properties.zip_code}`,
        rentAmount: tenantDetails.rent_amount,
        totalPayments,
        paidPayments,
        outstandingPayments: totalPayments - paidPayments,
        totalPaidAmount,
        paymentHistory: payments || []
      };
    },
    enabled: open,
  });

  const downloadCSV = () => {
    if (!summary?.paymentHistory) return;

    const headers = ['Payment Date', 'Amount', 'Status', 'Period Start', 'Period End'];
    const rows = summary.paymentHistory.map(payment => [
      payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A',
      `K${payment.amount}`,
      payment.status,
      payment.rent_period_start ? new Date(payment.rent_period_start).toLocaleDateString() : 'N/A',
      payment.rent_period_end ? new Date(payment.rent_period_end).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fullName}_payment_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tenant Summary - {fullName}</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="text-base font-medium">{summary?.email || 'N/A'}</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Property Address</p>
              <p className="text-base font-medium">{summary?.propertyAddress}</p>
            </div>
            <div className="grid gap-4">
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="text-2xl font-semibold">K{summary?.rentAmount}</p>
              </div>
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Paid Amount</p>
                <p className="text-2xl font-semibold text-green-600">K{summary?.totalPaidAmount}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Paid Rents</p>
                  <p className="text-2xl font-semibold text-green-600">{summary?.paidPayments}</p>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Outstanding</p>
                  <p className="text-2xl font-semibold text-yellow-600">{summary?.outstandingPayments}</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={downloadCSV} 
              className="w-full"
              disabled={!summary?.paymentHistory?.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Payment History
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}