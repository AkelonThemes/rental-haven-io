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

    async function fetchRole() {
      try {
        console.log('Fetching user role...');
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

        console.log('Session found, user ID:', session.user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          if (isSubscribed) {
            toast({
              title: "Error fetching user role",
              description: "Please try refreshing the page",
              variant: "destructive",
            });
            setRole(null);
            setLoading(false);
          }
        } else {
          console.log('Profile found, role:', profile?.role);
          if (isSubscribed) {
            setRole(profile?.role as 'landlord' | 'tenant');
            
            // Redirect based on role only if we're not already on the correct path
            if (profile?.role === 'tenant' && !window.location.pathname.startsWith('/tenant-')) {
              navigate('/tenant-dashboard');
            } else if (profile?.role === 'landlord' && window.location.pathname.startsWith('/tenant-')) {
              navigate('/dashboard');
            }
          }
        }
      } catch (error: any) {
        console.error('Error in fetchRole:', error);
        if (isSubscribed) {
          setRole(null);
          toast({
            title: "Error",
            description: "Failed to fetch user role",
            variant: "destructive",
          });
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (isSubscribed) {
        fetchRole();
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  return { role, loading };
}