
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionDetails } from "./SubscriptionDetails";

interface SubscriptionSectionProps {
  profile: Tables<"profiles"> | null;
}

export const SubscriptionSection = ({ profile }: SubscriptionSectionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription", sessionId],
    queryFn: async () => {
      if (!profile?.id) return null;

      console.log('Fetching subscription for profile:', profile.id);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("profile_id", profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Subscription error:', error);
        throw error;
      }

      console.log('Subscription data:', data);
      return data;
    },
    enabled: !!profile?.id,
    refetchInterval: sessionId ? 1000 : false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleUpgradeClick = async () => {
    try {
      if (subscription?.status === 'active') {
        toast({
          title: "Subscription Active",
          description: "You already have an active subscription. Please manage your subscription from the billing portal.",
          variant: "default",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-tenant-payment', {
        method: 'POST',
        body: { payment_type: 'subscription' },
      });
      
      if (error) {
        console.error('Error creating checkout session:', error);
        toast({
          title: "Error",
          description: "Failed to start checkout process. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <SubscriptionDetails
      subscription={subscription}
      isLoading={isLoadingSubscription}
      onUpgradeClick={handleUpgradeClick}
    />
  );
};
