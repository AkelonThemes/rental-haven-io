import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      console.log('Starting password update process...');

      if (data.newPassword !== data.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        return;
      }

      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      console.log('Updating password for user:', user.email);

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;
      console.log('Password updated successfully');

      // Send password change notification email
      console.log('Sending password change notification email...');
      const { error: emailError } = await supabase.functions.invoke('send-password-changed', {
        body: { userEmail: user.email }
      });

      if (emailError) {
        console.error('Error sending password change notification:', emailError);
        toast({
          title: "Warning",
          description: "Password updated successfully, but failed to send notification email",
          variant: "default",
        });
      } else {
        console.log('Password change notification sent successfully');
        toast({
          title: "Success",
          description: "Password updated successfully. A confirmation email has been sent.",
        });
      }

      form.reset();
    } catch (error: any) {
      console.error("Settings update error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Security Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Change your password to keep your account secure
        </p>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter current password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;