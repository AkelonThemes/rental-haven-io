import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { tenantEmail, tenantName, propertyAddress, password } = await req.json()

    console.log('Sending welcome email to:', tenantEmail)

    // During testing phase, redirect all emails to the verified email
    const testingEmail = 'ensolute@gmail.com'
    const isTestingPhase = true // Set this to false after domain verification

    // Send email with the appropriate link using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Rental Haven <onboarding@resend.dev>', // Using Resend's default domain
        to: isTestingPhase ? testingEmail : tenantEmail,
        subject: 'Welcome to Rental Haven - Your Login Credentials',
        html: `
          <p>Hello ${tenantName},</p>
          <p>Welcome to Rental Haven! Your landlord has added you as a tenant for the property at ${propertyAddress}.</p>
          ${isTestingPhase ? `<p><strong>Test Mode:</strong> This email was meant for ${tenantEmail}</p>` : ''}
          <p>Here are your login credentials:</p>
          <ul>
            <li><strong>Email:</strong> ${tenantEmail}</li>
            <li><strong>Password:</strong> ${password}</li>
          </ul>
          <p>Please use these credentials to log in at:</p>
          <p><a href="https://rental-haven-io.lovable.app/auth">Sign In to Your Account</a></p>
          <p><strong>Important Security Notice:</strong> For your account's security, please change your password immediately after logging in. You can do this by:</p>
          <ol>
            <li>Going to the Settings page from the sidebar menu</li>
            <li>Using the password change form to set a new, secure password</li>
          </ol>
          <p><strong>Note:</strong> Your email address (${tenantEmail}) will be your permanent login identifier and cannot be changed.</p>
          <p>Best regards,<br>The Rental Haven Team</p>
        `
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send welcome email: ${errorData}`)
    }

    const emailData = await emailResponse.json()
    console.log('Email sent successfully:', emailData)

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