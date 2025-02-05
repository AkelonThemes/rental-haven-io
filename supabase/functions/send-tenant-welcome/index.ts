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

    // For testing purposes, we'll send to the verified email
    const testEmail = 'ensolute@gmail.com'; // This should be your verified Resend email

    const emailResponse = await resend.emails.send({
      from: 'Rental Haven <onboarding@resend.dev>',
      to: testEmail, // Using the test email instead of tenantEmail
      subject: '[TEST] Welcome to Rental Haven - Your Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Rental Haven!</h1>
          <p>This is a test email for tenant: ${tenantName}</p>
          <p>Property Address: ${propertyAddress}</p>
          ${password ? `
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Test Login credentials:</strong></p>
              <ul>
                <li>Email that would be used: ${tenantEmail}</li>
                <li>Temporary Password that would be sent: ${password}</li>
              </ul>
            </div>
            <p><strong>Important:</strong> For security reasons, tenants will be asked to change their password after first login.</p>
          ` : ''}
          <p>Tenant portal access: <a href="https://rental-haven-io.lovable.app/auth">Rental Haven Login</a></p>
          <p>If you have any questions or need assistance, please contact your property manager.</p>
          <p>Best regards,<br>The Rental Haven Team</p>
          <p style="color: #666; font-size: 12px;">Note: This is a test email. In production, this would be sent to: ${tenantEmail}</p>
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