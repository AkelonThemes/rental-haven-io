import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Tenants from "./pages/Tenants";
import Notifications from "./pages/Notifications";
import Account from "./pages/Account";
import Dashboard from "./pages/Dashboard";
import TenantDashboard from "./pages/TenantDashboard";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { useRole } from "./hooks/use-role";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { role, loading: roleLoading } = useRole();
  const { toast } = useToast();

  useEffect(() => {
    // Set up initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        toast({
          title: "Session Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        handleSignOut();
        return;
      }
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setSession(null);
        queryClient.clear(); // Clear any cached data
        toast({
          title: "Session Expired",
          description: "Please sign in again to continue.",
        });
        return;
      }

      // Update session state
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, toast]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      queryClient.clear();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading state
  if (loading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <div className="text-sm text-gray-600">
          {loading ? "Checking authentication..." : "Loading user role..."}
        </div>
      </div>
    );
  }

  // Show landing page if no session
  if (!session) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<Navigate to="/landing" />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes - Landlord only */}
            {role === 'landlord' && (
              <>
                <Route
                  path="/dashboard"
                  element={session ? <Dashboard /> : <Navigate to="/landing" />}
                />
                <Route
                  path="/properties"
                  element={session ? <Index /> : <Navigate to="/landing" />}
                />
                <Route
                  path="/tenants"
                  element={session ? <Tenants /> : <Navigate to="/landing" />}
                />
              </>
            )}

            {/* Protected routes - Tenant only */}
            {role === 'tenant' && (
              <Route
                path="/dashboard"
                element={session ? <TenantDashboard /> : <Navigate to="/landing" />}
              />
            )}

            {/* Shared protected routes */}
            <Route
              path="/notifications"
              element={session ? <Notifications /> : <Navigate to="/landing" />}
            />
            <Route
              path="/account"
              element={session ? <Account /> : <Navigate to="/landing" />}
            />

            {/* Redirect root to dashboard when authenticated */}
            <Route
              path="/"
              element={
                session ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Navigate to="/landing" />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
