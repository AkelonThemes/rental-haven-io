import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Bell, UserCircle, LogOut, LayoutDashboard, Menu, X, Wrench, Settings, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRole } from "@/hooks/use-role";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const { role } = useRole();

  const landlordMenuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
    { icon: <Building2 className="w-5 h-5" />, label: "Properties", href: "/properties" },
    { icon: <Users className="w-5 h-5" />, label: "Tenants", href: "/tenants" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/notifications" },
    { icon: <UserCircle className="w-5 h-5" />, label: "Account", href: "/account" },
  ];

  const tenantMenuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
    { icon: <Wrench className="w-5 h-5" />, label: "Maintenance", href: "/maintenance" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/notifications" },
    { icon: <Lock className="w-5 h-5" />, label: "Settings", href: "/settings" },
  ];

  const menuItems = role === 'tenant' ? tenantMenuItems : landlordMenuItems;

  const handleSignOut = async () => {
    try {
      // First sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Then clear any local storage data
      localStorage.clear();
      
      // Navigate to landing page
      navigate("/landing");
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMenuItemClick = (href: string) => {
    navigate(href);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-primary-600" />
          <span className="text-lg font-semibold text-gray-900">PropManager</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
        ${isMobile ? 'z-50' : ''}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex-1">
            <div className="hidden md:flex items-center space-x-2 mb-8">
              <Building2 className="w-6 h-6 text-primary-600" />
              <span className="text-lg font-semibold text-gray-900">PropManager</span>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleMenuItemClick(item.href)}
                  className={`
                    w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm
                    ${location.pathname === item.href
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          {/* Settings and Sign Out Buttons */}
          <div className="p-4 border-t space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleMenuItemClick('/settings')}
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header spacer */}
        <div className="h-16 md:h-0" />
        
        {/* Scrollable content area */}
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
