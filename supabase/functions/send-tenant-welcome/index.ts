import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  tenantEmail: string;
  tenantName: string;
  propertyAddress: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantEmail, tenantName, propertyAddress, password }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${tenantEmail}`);

    const { data, error } = await resend.emails.send({
      from: 'PropManager <onboarding@resend.dev>',
      to: [tenantEmail],
      subject: 'Welcome to PropManager - Your Account Details',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to PropManager!</h1>
          <p>Hello ${tenantName},</p>
          <p>Your landlord has created an account for you in PropManager for the property at:</p>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${propertyAddress}</p>
          <p>You can now access your tenant portal using these credentials:</p>
          <ul>
            <li>Email: ${tenantEmail}</li>
            <li>Password: ${password}</li>
          </ul>
          <p>For security reasons, we recommend changing your password after your first login.</p>
          <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
            Login to Your Account
          </a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            If you have any questions, please contact your property manager.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true }),
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