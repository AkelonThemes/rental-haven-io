import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  tenantEmail: string;
  tenantName: string;
  propertyAddress: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting welcome email process...');
    const { tenantEmail, tenantName, propertyAddress }: WelcomeEmailRequest = await req.json();

    // For testing, override the recipient email with your email
    const testEmail = 'akelonthemes@gmail.com';
    console.log(`Original tenant email: ${tenantEmail}`);
    console.log(`Using test email: ${testEmail} for development`);

    // Get the request origin for redirect URL
    const origin = req.headers.get('origin') || 'https://0efd91fa-06c8-448c-841b-4fc627382398.lovableproject.com';
    console.log('Using redirect URL:', `${origin}/auth`);

    // First, check if user exists
    console.log('Checking for existing user...');
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users.find(user => user.email === tenantEmail);
    
    if (existingUser) {
      console.log('Found existing user, cleaning up associated data...');
      
      // Delete associated tenant records
      const { error: tenantDeleteError } = await supabase
        .from('tenants')
        .delete()
        .eq('profile_id', existingUser.id);
      
      if (tenantDeleteError) {
        console.error('Error deleting tenant records:', tenantDeleteError);
      }
      
      // Delete associated profile
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', existingUser.id);
      
      if (profileDeleteError) {
        console.error('Error deleting profile:', profileDeleteError);
      }
      
      // Finally delete the user
      console.log('Deleting user account...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        existingUser.id
      );
      
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        throw deleteError;
      }
      
      console.log('Existing user and associated data deleted successfully');
    }

    // Generate a temporary password for initial signup
    const tempPassword = crypto.randomUUID();
    
    // Create user with temporary password
    console.log('Creating user with temporary password...');
    const { data: signupData, error: signupError } = await supabase.auth.admin.createUser({
      email: tenantEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: tenantName,
        role: 'tenant'
      }
    });

    if (signupError) throw signupError;

    // Generate password reset link for the user to set their own password
    console.log('Generating password reset link...');
    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: tenantEmail,
      options: {
        redirectTo: `${origin}/auth`
      }
    });

    if (resetError) throw resetError;
    const actionLink = data.properties.action_link;

    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to PropManager!</h1>
        <p>Hello ${tenantName},</p>
        <p>Your landlord has invited you to create your tenant account for the property at:</p>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${propertyAddress}</p>
        <p>To create your tenant account and set up your password, please click the button below:</p>
        <a href="${actionLink}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          Create Your Account
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you have any questions, please contact your property manager.
        </p>
      </div>
    `;

    console.log('Sending invitation email...');
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'PropManager <onboarding@resend.dev>',
      to: [testEmail], // Using test email instead of actual tenant email
      subject: 'Welcome to PropManager - Create Your Account',
      html: emailContent,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: emailData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-tenant-welcome function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});