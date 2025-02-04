import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/use-role";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { role, loading: roleLoading } = useRole();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading || roleLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect tenants to tenant-specific routes
  if (role === 'tenant') {
    const tenantRoutes = ['/tenant-dashboard', '/tenant-maintenance', '/tenant-payments', '/tenant-account', '/tenant-settings'];
    const currentPath = location.pathname;
    
    // Redirect /account to /tenant-account for tenants
    if (currentPath === '/account') {
      return <Navigate to="/tenant-account" replace />;
    }

    // Redirect /settings to /tenant-settings for tenants
    if (currentPath === '/settings') {
      return <Navigate to="/tenant-settings" replace />;
    }
    
    // Allow access to tenant-specific routes
    if (tenantRoutes.some(route => currentPath.startsWith(route))) {
      return <>{children}</>;
    }
    
    // If accessing any other route, redirect to tenant dashboard
    return <Navigate to="/tenant-dashboard" replace />;
  }

  // Redirect landlords to landlord-specific routes
  if (role === 'landlord') {
    const landlordRoutes = ['/dashboard', '/properties', '/tenants', '/maintenance', '/payments', '/account', '/settings'];
    const isAccessingTenantRoute = location.pathname.includes('tenant-');
    
    if (isAccessingTenantRoute) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}