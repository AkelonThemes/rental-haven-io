import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { getLandlordMenuItems, getTenantMenuItems } from "./DashboardMenuItems";

interface DashboardSidebarProps {
  role: string;
  isMobile: boolean;
  isSidebarOpen: boolean;
  onMenuItemClick: (href: string) => void;
  onSignOut: () => void;
}

export const DashboardSidebar = ({
  role,
  isMobile,
  isSidebarOpen,
  onMenuItemClick,
  onSignOut,
}: DashboardSidebarProps) => {
  const location = useLocation();
  const menuItems = role === 'tenant' ? getTenantMenuItems() : getLandlordMenuItems();

  return (
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
                onClick={() => onMenuItemClick(item.href)}
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
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={onSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};