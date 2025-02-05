import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tenantEmail, tenantName, propertyAddress, password } = await req.json()

    console.log('Sending welcome email to:', tenantEmail)

    if (!password) {
      console.log('No password provided, skipping welcome email')
      return new Response(
        JSON.stringify({ success: true, message: 'No password provided, skipping welcome email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResponse = await resend.emails.send({
      from: 'Rental Haven <onboarding@resend.dev>',
      to: tenantEmail,
      subject: 'Welcome to Rental Haven - Your Login Credentials',
      html: `
        <p>Hello ${tenantName},</p>
        <p>Welcome to Rental Haven! Your landlord has added you as a tenant for the property at ${propertyAddress}.</p>
        <p>Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${tenantEmail}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>Please use these credentials to log in at:</p>
        <p><a href="https://rental-haven-io.lovable.app/login">Sign In to Your Account</a></p>
        <p><strong>Important Security Notice:</strong> For your account's security, please change your password immediately after logging in.</p>
        <p>Best regards,<br>The Rental Haven Team</p>
      `
    })

    console.log('Email sent successfully:', emailResponse)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-tenant-welcome function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})