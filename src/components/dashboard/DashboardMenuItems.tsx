import { Building2, Users, Bell, UserCircle, LayoutDashboard, Wrench, Settings } from "lucide-react";

export const getLandlordMenuItems = () => [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
  { icon: <Building2 className="w-5 h-5" />, label: "Properties", href: "/properties" },
  { icon: <Users className="w-5 h-5" />, label: "Tenants", href: "/tenants" },
  { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/notifications" },
  { icon: <UserCircle className="w-5 h-5" />, label: "Account", href: "/account" },
  { icon: <Settings className="w-5 h-5" />, label: "Settings", href: "/settings" },
];

export const getTenantMenuItems = () => [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
  { icon: <Wrench className="w-5 h-5" />, label: "Maintenance", href: "/tenant-maintenance" },
  { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/notifications" },
  { icon: <UserCircle className="w-5 h-5" />, label: "Account", href: "/account" },
  { icon: <Settings className="w-5 h-5" />, label: "Settings", href: "/settings" },
];