import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function MobileHeader({
  isMobileMenuOpen,
  onToggleMobileMenu,
}: MobileHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white border-b lg:hidden">
      <Building2 className="h-6 w-6 text-primary" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleMobileMenu}
        className="lg:hidden"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}