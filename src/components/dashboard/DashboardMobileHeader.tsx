import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardMobileHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const DashboardMobileHeader = ({
  isSidebarOpen,
  onToggleSidebar,
}: DashboardMobileHeaderProps) => {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-2">
        <Building2 className="w-6 h-6 text-primary-600" />
        <span className="text-lg font-semibold text-gray-900">PropManager</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>
    </div>
  );
};