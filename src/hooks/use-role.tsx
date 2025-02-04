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
          // If there's an error fetching the profile, set a default role
          setRole('landlord');
          
          // Create a default profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              role: 'landlord',
              full_name: session.user.user_metadata?.full_name || null,
              email: session.user.email
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            toast({
              title: "Error creating user profile",
              description: insertError.message,
              variant: "destructive",
            });
          }
        } else {
          console.log('Profile found, role:', profile?.role);
          setRole(profile?.role as 'landlord' | 'tenant');
        }
      } catch (error: any) {
        console.error('Error in fetchRole:', error);
        // Set a default role in case of error
        setRole('landlord');
        toast({
          title: "Error",
          description: "Failed to fetch user role. Using default role.",
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