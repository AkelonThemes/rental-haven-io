import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, FileText, Bell, UserCircle, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { icon: <Building2 className="w-5 h-5" />, label: "Properties", href: "/" },
    { icon: <Users className="w-5 h-5" />, label: "Tenants", href: "/tenants" },
    { icon: <FileText className="w-5 h-5" />, label: "Payments", href: "/payments" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/notifications" },
    { icon: <UserCircle className="w-5 h-5" />, label: "Account", href: "/account" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white border-r border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-8">
            <Building2 className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-semibold text-gray-900">PropManager</span>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant={location.pathname === item.href ? "default" : "ghost"}
                className="w-full justify-start gap-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                onClick={() => navigate(item.href)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="absolute bottom-4 w-56">
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
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;