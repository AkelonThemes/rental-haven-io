import { LayoutDashboard, Building2, Users, Bell, UserCircle, Wrench, Settings, Receipt } from "lucide-react";
import { NavigationItem } from "@/types/navigation";

export const getLandlordMenuItems = (): NavigationItem[] => [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Tenants", href: "/tenants", icon: Users },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Payments", href: "/payments", icon: Receipt },
  { name: "Account", href: "/account", icon: UserCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const getTenantMenuItems = (): NavigationItem[] => [
  { name: "Dashboard", href: "/tenant-dashboard", icon: LayoutDashboard },
  { name: "Maintenance", href: "/tenant-maintenance", icon: Wrench },
  { name: "Account", href: "/account", icon: UserCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];