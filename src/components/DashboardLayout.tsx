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
  const { role, loading: roleLoading } = useRole();

  const handleSignOut = async () => {
    try {
      localStorage.clear();
      const { error } = await supabase.auth.signOut();
      navigate("/landing");
      
      if (error) {
        console.error("Sign out error:", error);
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

  if (roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
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

      <main className="flex-1 flex flex-col min-h-screen">
        <div className="h-16 md:h-0" /> {/* Mobile header spacing */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;