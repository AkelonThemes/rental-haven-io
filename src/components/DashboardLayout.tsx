import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, FileText, Bell, UserCircle, LogOut, LayoutDashboard, Menu, X, Wrench } from "lucide-react";
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
    { icon: <FileText className="w-5 h-5" />, label: "Payments", href: "/payments" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/notifications" },
    { icon: <UserCircle className="w-5 h-5" />, label: "Account", href: "/account" },
  ];

  const tenantMenuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
    { icon: <Wrench className="w-5 h-5" />, label: "Maintenance", href: "/maintenance" },
    { icon: <FileText className="w-5 h-5" />, label: "Payments", href: "/payments" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/notifications" },
    { icon: <UserCircle className="w-5 h-5" />, label: "Account", href: "/account" },
  ];

  const menuItems = role === 'tenant' ? tenantMenuItems : landlordMenuItems;

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/landing");
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
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

  const handleContentClick = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-primary-600" />
          <span className="text-lg font-semibold text-gray-900">PropManager</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:static
          top-[65px] md:top-0
          h-[calc(100vh-65px)] md:h-screen
          w-64
          bg-white
          border-r
          border-gray-200
          p-4
          transition-transform
          duration-300
          ease-in-out
          z-50
          flex flex-col
        `}>
          {/* Desktop Logo */}
          <div className="hidden md:flex items-center space-x-2 mb-8">
            <Building2 className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-semibold text-gray-900">PropManager</span>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant={location.pathname === item.href ? "default" : "ghost"}
                className="w-full justify-start gap-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                onClick={() => handleMenuItemClick(item.href)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Mobile Logout Button - At bottom */}
          <div className="md:hidden mt-auto pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-gray-600 hover:text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>

          {/* Desktop Logout Button */}
          <div className="hidden md:block mt-auto">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-gray-600 hover:text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="flex-1 p-4 md:p-8 w-full overflow-x-hidden"
          onClick={handleContentClick}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
