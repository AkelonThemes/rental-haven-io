import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WelcomeEmailRequest {
  tenantEmail: string;
  tenantName: string;
  propertyAddress: string;
  password?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tenantEmail, tenantName, propertyAddress, password }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', tenantEmail);

    const emailResponse = await resend.emails.send({
      from: 'Rental Haven <onboarding@resend.dev>',
      to: tenantEmail,
      subject: 'Welcome to Rental Haven - Your Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Rental Haven!</h1>
          <p>Hello ${tenantName},</p>
          <p>Your landlord has added you as a tenant for the property at ${propertyAddress}.</p>
          ${password ? `
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Your login credentials:</strong></p>
              <ul>
                <li>Email: ${tenantEmail}</li>
                <li>Temporary Password: ${password}</li>
              </ul>
            </div>
            <p><strong>Important:</strong> For security reasons, please change your password after your first login.</p>
          ` : ''}
          <p>You can access your tenant portal at: <a href="https://rental-haven-io.lovable.app/auth">Rental Haven Login</a></p>
          <p>If you have any questions or need assistance, please contact your property manager.</p>
          <p>Best regards,<br>The Rental Haven Team</p>
        </div>
      `
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-tenant-welcome function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});