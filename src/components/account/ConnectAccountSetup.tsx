import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface ConnectAccountSetupProps {
  profile: Tables<"profiles"> | null;
}

export function ConnectAccountSetup({ profile }: ConnectAccountSetupProps) {
  if (profile?.role !== 'landlord') {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Payment Processing</h2>
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>
            Your account is ready to process payments. When tenants make payments, they will be processed through our platform
            and we will handle the transfer of funds to you on a monthly basis.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Tenant payments will be automatically recorded and visible in your dashboard. 
          Funds will be transferred to you monthly, with transaction fees deducted.
        </p>
      </div>
    </Card>
  );
}