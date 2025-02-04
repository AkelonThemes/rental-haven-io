import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/use-role";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const { role } = useRole();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };

    checkUser();
  }, []);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect tenants to tenant-specific routes
  if (role === 'tenant') {
    const tenantRoutes = ['/tenant-dashboard', '/tenant-maintenance', '/notifications', '/account', '/settings'];
    const isAccessingLandlordRoute = !tenantRoutes.some(route => location.pathname.startsWith(route));
    
    if (isAccessingLandlordRoute && location.pathname !== '/') {
      return <Navigate to="/tenant-dashboard" replace />;
    }
  }

  // Redirect landlords to landlord-specific routes
  if (role === 'landlord') {
    const landlordRoutes = ['/dashboard', '/properties', '/tenants', '/maintenance', '/notifications', '/account', '/settings'];
    const isAccessingTenantRoute = location.pathname.includes('tenant-');
    
    if (isAccessingTenantRoute) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}