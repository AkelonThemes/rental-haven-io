import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { ProfileDetails } from "@/components/account/ProfileDetails";
import { ConnectAccountSetup } from "@/components/account/ConnectAccountSetup";
import { SubscriptionSection } from "@/components/account/SubscriptionSection";
import { PaymentSection } from "@/components/account/PaymentSection";
import { Spinner } from "@/components/ui/spinner";

const Account = () => {
  const navigate = useNavigate();

  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      console.log('Fetching profile data...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        navigate("/auth");
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }
      
      console.log('Profile data:', profile);
      return profile;
    },
    retry: false,
  });

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        <div className="grid gap-6">
          <ProfileDetails profile={profile} />
          {profile?.role === 'landlord' && (
            <>
              <ConnectAccountSetup profile={profile} />
              <SubscriptionSection profile={profile} />
              <PaymentSection profile={profile} />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Account;