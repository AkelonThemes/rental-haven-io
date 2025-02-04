import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { DashboardSidebarContent } from "./dashboard/DashboardSidebarContent";
import { MobileHeader } from "./dashboard/MobileHeader";
import { getLandlordMenuItems, getTenantMenuItems } from "./dashboard/DashboardMenuItems";
import { Skeleton } from "./ui/skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading } = useRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = role === 'tenant' ? getTenantMenuItems() : getLandlordMenuItems();

  const handleSignOut = async () => {
    try {
      localStorage.clear();
      const { error } = await supabase.auth.signOut();
      navigate("/");
      
      if (error) {
        console.error("Sign out error:", error);
        toast({
          title: "Error signing out",
          description: "There was a problem signing out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been logged out of your account.",
        });
      }
    } catch (error: any) {
      console.error("Sign out error:", error);
      localStorage.clear();
      navigate("/");
      
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!role) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 transform bg-white transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center pl-4 pt-16">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <DashboardSidebarContent
          navigation={navigation}
          isMobile={true}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
        <div className="flex grow flex-col gap-y-3 overflow-y-auto border-r border-gray-200 bg-white">
          <div className="flex h-14 shrink-0 items-center pl-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DashboardSidebarContent
            navigation={navigation}
            onSignOut={handleSignOut}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="lg:pl-60">
        <div className="px-4 sm:px-6 lg:px-8 py-6 mt-16 lg:mt-0">{children}</div>
      </main>
    </div>
  );
}