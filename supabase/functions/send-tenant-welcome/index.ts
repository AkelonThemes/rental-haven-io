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

    // Generate a signup link
    const { data, error: signupError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: tenantEmail,
      options: {
        redirectTo: 'https://rental-haven-io.lovable.app/auth'
      }
    });

    if (signupError) throw signupError;
    
    const signupLink = data.properties.action_link;
    console.log('Generated signup link:', signupLink);

    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to PropManager!</h1>
        <p>Hello ${tenantName},</p>
        <p>Your landlord has invited you to access your tenant account for the property at:</p>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${propertyAddress}</p>
        <p>To create your account and access the tenant portal, please click the button below:</p>
        <a href="${signupLink}" 
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
      to: [tenantEmail],
      subject: 'Welcome to PropManager - Create Your Account',
      html: emailContent,
    });

    if (emailError) throw emailError;
    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true
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