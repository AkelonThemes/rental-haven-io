import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationItem } from "@/types/navigation";

interface DashboardSidebarContentProps {
  navigation: NavigationItem[];
  isMobile?: boolean;
  onMobileMenuClose?: () => void;
  onSignOut: () => void;
}

export function DashboardSidebarContent({
  navigation,
  isMobile,
  onMobileMenuClose,
  onSignOut,
}: DashboardSidebarContentProps) {
  const handleItemClick = () => {
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 overflow-y-auto pl-4 pr-2 py-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-4">
          <li>
            <ul role="list" className="-ml-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={handleItemClick}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold hover:bg-gray-50 hover:text-primary",
                        window.location.pathname === item.href
                          ? "bg-gray-50 text-primary"
                          : "text-gray-700"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          window.location.pathname === item.href
                            ? "text-primary"
                            : "text-gray-400 group-hover:text-primary"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start gap-x-3"
              onClick={onSignOut}
            >
              <LogOut className="h-5 w-5 text-gray-400" />
              Sign out
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
}