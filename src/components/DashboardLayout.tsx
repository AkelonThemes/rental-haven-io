import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/hooks/use-role";
import { DashboardSidebar } from "./dashboard/DashboardSidebar";
import { DashboardMobileHeader } from "./dashboard/DashboardMobileHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const { role } = useRole();

  const handleSignOut = async () => {
    try {
      // First clear local storage to ensure we remove any stale data
      localStorage.clear();
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Even if there's an error, we want to redirect to landing
      // as the user's session might be invalid
      navigate("/landing");
      
      if (error) {
        console.error("Sign out error:", error);
        // Show a generic success message as the user is effectively signed out
        toast({
          title: "Signed out",
          description: "You have been logged out of your account.",
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been logged out of your account.",
        });
      }
    } catch (error: any) {
      console.error("Sign out error:", error);
      // Even if there's an error, clear local storage and redirect
      localStorage.clear();
      navigate("/landing");
      
      toast({
        title: "Signed out",
        description: "You have been logged out of your account.",
      });
    }
  };

  const handleMenuItemClick = (href: string) => {
    navigate(href);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <DashboardMobileHeader 
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <DashboardSidebar
        role={role}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        onMenuItemClick={handleMenuItemClick}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 md:h-0" />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;