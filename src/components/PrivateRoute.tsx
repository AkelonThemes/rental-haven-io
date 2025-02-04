import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";
import { Spinner } from "@/components/ui/spinner";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const { role, loading: roleLoading } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          navigate('/login', { replace: true });
          return;
        }

        if (!session?.user) {
          console.log('No session found, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        console.log('Session found, user:', session.user.id);
        setUser(session.user);

        // Get user profile to verify role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        console.log('User profile:', profile);

      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  if (!user || roleLoading) {
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
      console.log('Tenant accessing landlord route, redirecting to tenant dashboard');
      return <Navigate to="/tenant-dashboard" replace />;
    }
  }

  // Redirect landlords to landlord-specific routes
  if (role === 'landlord') {
    const landlordRoutes = ['/dashboard', '/properties', '/tenants', '/maintenance', '/notifications', '/account', '/settings'];
    const isAccessingTenantRoute = location.pathname.includes('tenant-');
    
    if (isAccessingTenantRoute) {
      console.log('Landlord accessing tenant route, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}