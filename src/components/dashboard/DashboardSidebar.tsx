import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { NavigationItem } from "@/types/navigation";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  role: string | null;
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
  const menuItems: NavigationItem[] = [];

  return (
    <aside 
      className={cn(
        "fixed md:sticky top-0 left-0 h-full w-64 bg-white border-r shadow-sm",
        "transform transition-transform duration-300 ease-in-out z-50",
        isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-8">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-gray-900">
              {role === 'tenant' ? 'Tenant Portal' : 'PropManager'}
            </span>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => onMenuItemClick(item.href)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm",
                    "transition-colors duration-200",
                    location.pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
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
    </aside>
  );
};