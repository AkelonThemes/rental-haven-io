import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { ProfileDetails } from "@/components/account/ProfileDetails";
import { useRole } from "@/hooks/use-role";

const TenantAccount = () => {
  const navigate = useNavigate();
  const { role } = useRole();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      console.log('Fetching tenant profile data...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        navigate("/login");
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
      
      console.log('Tenant profile data:', profile);
      return profile;
    },
    retry: false,
  });

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
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
          <ProfileDetails profile={profile} role={role} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TenantAccount;