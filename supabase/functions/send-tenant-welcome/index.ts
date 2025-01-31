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

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser.users.some(user => user.email === tenantEmail);

    let emailContent;
    let actionLink;

    if (userExists) {
      console.log('User already exists, generating sign in link');
      const { data, error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: tenantEmail,
        options: {
          redirectTo: `${origin}/auth`
        }
      });

      if (signInError) throw signInError;
      actionLink = data.properties.action_link;
      
      emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to PropManager!</h1>
          <p>Hello ${tenantName},</p>
          <p>Your landlord has added you as a tenant for the property at:</p>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${propertyAddress}</p>
          <p>Since you already have an account, click the button below to sign in to your tenant portal:</p>
          <a href="${actionLink}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
            Sign In to Tenant Portal
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you have any questions, please contact your property manager.
          </p>
        </div>
      `;
    } else {
      console.log('New user, generating signup link');
      const { data, error: signupError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: tenantEmail,
        options: {
          data: {
            full_name: tenantName,
            role: 'tenant'
          },
          redirectTo: `${origin}/auth`
        }
      });

      if (signupError) throw signupError;
      actionLink = data.properties.action_link;

      emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to PropManager!</h1>
          <p>Hello ${tenantName},</p>
          <p>Your landlord has invited you to create your tenant account for the property at:</p>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${propertyAddress}</p>
          <p>To create your tenant account and access your portal, please click the button below:</p>
          <a href="${actionLink}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
            Create Your Account
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you have any questions, please contact your property manager.
          </p>
        </div>
      `;
    }

    console.log('Sending invitation email...');
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'PropManager <onboarding@resend.dev>',
      to: [testEmail], // Using test email instead of actual tenant email
      subject: userExists ? 'Access Your Tenant Portal - PropManager' : 'Welcome to PropManager - Create Your Account',
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
        data: emailData,
        userExists
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