import { Card } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

interface ProfileDetailsProps {
  profile: Tables<"profiles"> | null;
}

export const ProfileDetails = ({ profile }: ProfileDetailsProps) => {
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
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Company
          </label>
          <p className="text-base">{profile?.company_name || "Not set"}</p>
        </div>
      </div>
    </Card>
  );
};