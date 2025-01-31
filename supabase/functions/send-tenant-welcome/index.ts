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

    console.log(`Sending welcome email to ${tenantEmail} for property at ${propertyAddress}`);

    // Check if user already exists
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    if (getUserError) throw getUserError;

    const existingUser = users.find(user => user.email === tenantEmail);
    let actionLink: string;

    if (existingUser) {
      console.log('Existing user found, generating magic link...');
      const { data, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: tenantEmail,
        options: {
          redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth`
        }
      });

      if (magicLinkError) throw magicLinkError;
      if (!data?.properties?.action_link) throw new Error('Magic link generation failed');
      
      actionLink = data.properties.action_link;
      console.log('Magic link generated successfully');
    } else {
      console.log('New user, generating signup link...');
      const { data, error: signupError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: tenantEmail,
        options: {
          data: {
            full_name: tenantName,
            role: 'tenant'
          },
          redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth`
        }
      });

      if (signupError) throw signupError;
      if (!data?.properties?.action_link) throw new Error('Signup link generation failed');
      
      actionLink = data.properties.action_link;
      console.log('Signup link generated successfully');
    }

    // In test mode, we'll send the email to the Resend account email
    // This is temporary until a domain is verified
    const testModeEmail = 'akelonthemes@gmail.com';
    
    console.log('Sending email with action link...');
    console.log('Using test mode - sending to:', testModeEmail);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'PropManager <onboarding@resend.dev>',
      to: [testModeEmail], // Use test mode email
      subject: existingUser ? 'Welcome Back to PropManager' : 'Welcome to PropManager - Complete Your Account Setup',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome ${existingUser ? 'Back ' : ''}to PropManager!</h1>
          <p>Hello ${tenantName},</p>
          <p>This is a test mode email. In production, this would be sent to: ${tenantEmail}</p>
          <p>${existingUser ? 'Your landlord has added you' : 'Your account has been created'} in PropManager for the property at:</p>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${propertyAddress}</p>
          <p>${existingUser ? 'To access your tenant portal, please click the button below:' : 'To complete your account setup and access your tenant portal, please click the button below:'}</p>
          <a href="${actionLink}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
            ${existingUser ? 'Access Tenant Portal' : 'Complete Account Setup'}
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you have any questions, please contact your property manager.
          </p>
        </div>
      `,
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
        testMode: true,
        sentTo: testModeEmail,
        originalRecipient: tenantEmail 
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