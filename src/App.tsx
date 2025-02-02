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
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import TenantDashboard from "./pages/TenantDashboard";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { useRole } from "./hooks/use-role";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { role, loading: roleLoading } = useRole();
  const { toast } = useToast();

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (error.message.includes('Invalid Refresh Token')) {
            // Clear the invalid session
            await supabase.auth.signOut();
            setSession(null);
          } else {
            throw error;
          }
        } else {
          setSession(session);
        }
      } catch (error: any) {
        console.error("Error getting session:", error);
        toast({
          title: "Session Error",
          description: "Please sign in again",
          variant: "destructive",
        });
        // Ensure we clear any invalid session state
        await supabase.auth.signOut();
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'TOKEN_REFRESHED') {
        console.log('Token was refreshed successfully');
      }
      setSession(session);
      if (!session) {
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/properties" element={<Index />} />
                <Route path="/tenants" element={<Tenants />} />
              </>
            )}

            {/* Protected routes - Tenant only */}
            {role === 'tenant' && (
              <Route path="/dashboard" element={<TenantDashboard />} />
            )}

            {/* Shared protected routes */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />

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