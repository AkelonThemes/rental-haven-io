import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRole() {
  const [role, setRole] = useState<'landlord' | 'tenant' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setRole(profile?.role as 'landlord' | 'tenant' || null);
      setLoading(false);
    }

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading };
}