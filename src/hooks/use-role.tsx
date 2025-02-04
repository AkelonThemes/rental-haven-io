import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useRole() {
  const [role, setRole] = useState<'landlord' | 'tenant' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchRole() {
      try {
        console.log('Fetching user role...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log('No session found');
          setRole(null);
          setLoading(false);
          return;
        }

        console.log('Session found, user ID:', session.user.id);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Error fetching user role",
            description: profileError.message,
            variant: "destructive",
          });
          throw profileError;
        }

        if (!profile) {
          console.log('No profile found, creating default profile...');
          // Create a default profile if none exists
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              role: 'landlord', // Default role
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
            throw insertError;
          }

          console.log('Created new landlord profile');
          setRole('landlord');
        } else {
          console.log('Profile found:', profile);
          setRole(profile.role as 'landlord' | 'tenant');
        }
      } catch (error: any) {
        console.error('Error in fetchRole:', error);
        toast({
          title: "Error",
          description: "Failed to fetch user role. Please try again.",
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
  }, [toast]);

  return { role, loading };
}