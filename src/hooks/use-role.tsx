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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found');
          setRole(null);
          setLoading(false);
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
          toast({
            title: "Error fetching user role",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }

        if (!profile) {
          console.log('No profile found, creating default profile...');
          // Create a default profile if none exists
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              role: 'landlord', // Default role
              full_name: session.user.user_metadata?.full_name || null
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

          setRole('landlord');
        } else {
          console.log('Profile found, role:', profile.role);
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