import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfileDetailsProps {
  profile: Tables<"profiles"> | null;
  role?: string | null;
}

export const ProfileDetails = ({ profile, role }: ProfileDetailsProps) => {
  const { data: tenantProperty } = useQuery({
    queryKey: ['tenant-property', profile?.id],
    queryFn: async () => {
      if (role !== 'tenant' || !profile?.id) return null;

      const { data: tenant } = await supabase
        .from('tenants')
        .select(`
          property:properties (
            address
          )
        `)
        .eq('profile_id', profile.id)
        .single();

      return tenant?.property;
    },
    enabled: role === 'tenant' && !!profile?.id,
  });

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Full Name
          </label>
          <p className="text-base">{profile?.full_name || "Not set"}</p>
        </div>
        {role === 'landlord' && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Company
            </label>
            <p className="text-base">{profile?.company_name || "Not set"}</p>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Email
          </label>
          <p className="text-base">{profile?.email || "Not set"}</p>
        </div>
        {role === 'tenant' && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Rented Property
            </label>
            <p className="text-base">{tenantProperty?.address || "Not assigned"}</p>
          </div>
        )}
      </div>
    </Card>
  );
};