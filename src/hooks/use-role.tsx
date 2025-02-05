import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function useRole() {
  const [role, setRole] = useState<'landlord' | 'tenant' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isSubscribed = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchRole() {
      try {
        console.log('Fetching user role...');
        
        // Get current session and check if it needs refresh
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found');
          if (isSubscribed) {
            setRole(null);
            setLoading(false);
          }
          navigate('/login');
          return;
        }

        // Check if token is about to expire (within 60 seconds)
        const expiresAt = session?.expires_at || 0;
        const isExpiringSoon = (expiresAt * 1000) - Date.now() < 60000;

        if (isExpiringSoon) {
          console.log('Session expiring soon, refreshing...');
          const { data: { session: refreshedSession }, error: refreshError } = 
            await supabase.auth.refreshSession();
          
          if (refreshError) {
            throw refreshError;
          }
          
          if (!refreshedSession) {
            throw new Error('Failed to refresh session');
          }
        }

        console.log('Session found, user ID:', session.user.id);

        // Add retry logic for profile fetch
        const fetchProfileWithRetry = async () => {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) throw error;
            
            console.log('Profile found, role:', profile?.role);
            if (isSubscribed) {
              setRole(profile?.role as 'landlord' | 'tenant');
              setLoading(false);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying profile fetch (${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              return fetchProfileWithRetry();
            }
            throw error;
          }
        };

        await fetchProfileWithRetry();
      } catch (error: any) {
        console.error('Error in fetchRole:', error);
        if (isSubscribed) {
          setRole(null);
          setLoading(false);
          toast({
            title: "Session Error",
            description: "Please sign in again to continue.",
            variant: "destructive",
          });
          navigate('/login');
        }
      }
    }

    fetchRole();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (isSubscribed) {
        if (event === 'SIGNED_OUT') {
          setRole(null);
          navigate('/login');
        } else if (session) {
          fetchRole();
        }
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  return { role, loading };
}