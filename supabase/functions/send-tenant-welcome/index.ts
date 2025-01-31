import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tenantEmail, tenantName, propertyAddress } = await req.json()

    console.log('Sending welcome email to:', tenantEmail)

    // Create a simple base64 encoded token with the email
    const token = btoa(JSON.stringify({ email: tenantEmail }))
    const signUpLink = `https://rental-haven-io.lovable.app/auth?token=${token}`

    console.log('Sending email via Resend with link:', signUpLink)

    // During development, we'll send a test email to the registered email
    const testEmail = 'akelonthemes@gmail.com' // The email registered with Resend
    console.log(`Development mode: Redirecting email to ${testEmail} instead of ${tenantEmail}`)

    // Send email with the appropriate link using Resend's test configuration
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: testEmail, // Send to the test email during development
        subject: '[TEST] Welcome to Rental Haven - Create Your Account',
        html: `
          <p>Hello ${tenantName},</p>
          <p>Welcome to Rental Haven! Your landlord has added you as a tenant for the property at ${propertyAddress}.</p>
          <p>To create your tenant account, please click the link below:</p>
          <p><a href="${signUpLink}">Create Your Account</a></p>
          <p>Best regards,<br>The Rental Haven Team</p>
          <p style="color: #666; font-size: 12px;">Note: This is a test email. In production, this would be sent to: ${tenantEmail}</p>
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