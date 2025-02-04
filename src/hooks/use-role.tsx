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
    async function fetchRole() {
      try {
        console.log('Fetching user role...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found');
          setRole(null);
          setLoading(false);
          navigate('/login');
          return;
        }

        console.log('Session found, user ID:', session.user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error fetching user role",
            description: error.message,
            variant: "destructive",
          });
          setRole(null);
        } else {
          console.log('Profile found, role:', profile?.role);
          setRole(profile?.role as 'landlord' | 'tenant');
          
          // Redirect based on role
          if (profile?.role === 'tenant') {
            if (!window.location.pathname.startsWith('/tenant-')) {
              navigate('/tenant-dashboard');
            }
          } else if (profile?.role === 'landlord') {
            if (window.location.pathname.startsWith('/tenant-')) {
              navigate('/dashboard');
            }
          }
        }
      } catch (error: any) {
        console.error('Error in fetchRole:', error);
        setRole(null);
        toast({
          title: "Error",
          description: "Failed to fetch user role",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  return { role, loading };
}