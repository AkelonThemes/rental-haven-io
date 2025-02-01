import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Wallet, ArrowRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface ConnectAccountSetupProps {
  profile: Tables<"profiles"> | null;
  refetchProfile: () => void;
}

export function ConnectAccountSetup({ profile, refetchProfile }: ConnectAccountSetupProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      console.log('Returned from Stripe Connect onboarding, refreshing profile...');
      refetchProfile();
      toast({
        title: "Account Connected",
        description: "Your bank account has been successfully connected.",
      });
    }
  }, [success, refetchProfile, toast]);

  const handleConnectAccount = async () => {
    try {
      setLoading(true);
      console.log('Creating Connect account...');
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      
      if (error) throw error;
      
      if (data?.url) {
        console.log('Redirecting to Stripe Connect onboarding:', data.url);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating Connect account:', error);
      toast({
        title: "Error",
        description: "Failed to create Stripe Connect account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'restricted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Payment Account Setup</h2>
      <div className="space-y-4">
        {!profile?.stripe_connect_id ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-muted-foreground">
              Connect your bank account to receive rent payments directly.
            </p>
            <Button
              onClick={handleConnectAccount}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {loading ? "Setting up..." : "Connect Bank Account"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(profile.stripe_connect_status)}`}>
                {profile.stripe_connect_status || 'Unknown'}
              </span>
            </div>
            {profile.stripe_connect_status === 'pending' && (
              <Button
                onClick={handleConnectAccount}
                variant="outline"
                className="mt-2"
              >
                Complete Setup
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}