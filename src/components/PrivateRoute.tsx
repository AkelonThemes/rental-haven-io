import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";
import { Spinner } from "@/components/ui/spinner";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const { role } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate('/login', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
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