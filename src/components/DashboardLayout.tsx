import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Wrench,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Properties", href: "/properties", icon: Building2 },
    { name: "Tenants", href: "/tenants", icon: Users },
    { name: "Payments", href: "/payments", icon: Receipt },
    { name: "Maintenance", href: "/maintenance", icon: Wrench },
    { name: "Account", href: "/account", icon: UserCircle },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      localStorage.clear();
      const { error } = await supabase.auth.signOut();
      navigate("/");
      
      if (error) {
        console.error("Sign out error:", error);
        toast({
          title: "Error signing out",
          description: "There was a problem signing out. Please try again.",
          variant: "destructive",
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
      navigate("/");
      
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!role) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white border-b lg:hidden">
        <Building2 className="h-6 w-6 text-primary" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-white transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 pt-16">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <nav className="flex-1 overflow-y-auto px-6 py-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold hover:bg-gray-50 hover:text-primary",
                          window.location.pathname === item.href
                            ? "bg-gray-50 text-primary"
                            : "text-gray-700"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-6 w-6 shrink-0",
                            window.location.pathname === item.href
                              ? "text-primary"
                              : "text-gray-400 group-hover:text-primary"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-x-3"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-6 w-6 text-gray-400" />
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold hover:bg-gray-50 hover:text-primary",
                          window.location.pathname === item.href
                            ? "bg-gray-50 text-primary"
                            : "text-gray-700"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-6 w-6 shrink-0",
                            window.location.pathname === item.href
                              ? "text-primary"
                              : "text-gray-400 group-hover:text-primary"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-x-3"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-6 w-6 text-gray-400" />
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8 py-6 mt-16 lg:mt-0">{children}</div>
      </main>
    </div>
  );
}