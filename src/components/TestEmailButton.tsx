import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

export function TestEmailButton() {
  const { toast } = useToast();

  const sendTestEmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('send-tenant-welcome', {
        body: {
          tenantEmail: 'nlakaa1hirecars@gmail.com',
          tenantName: 'Test User',
          propertyAddress: '123 Test Street'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "Test email sent",
        description: "Check your inbox for the test email",
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error sending test email",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={sendTestEmail} variant="outline" size="sm">
      <Send className="w-4 h-4 mr-2" />
      Send Test Email
    </Button>
  );
}