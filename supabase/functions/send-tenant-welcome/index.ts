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

    const { tenantEmail, tenantName, propertyAddress } = await req.json()

    console.log('Sending welcome email to:', tenantEmail)

    // First check if the user already exists
    const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers({
      filter: {
        email: tenantEmail
      }
    })

    if (userError) {
      console.error('Error checking existing user:', userError)
      throw userError
    }

    let signInLink
    if (existingUser.users.length > 0) {
      console.log('User exists, generating magic link')
      // Generate a magic link for existing user
      const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: tenantEmail,
        options: {
          redirectTo: 'https://rental-haven-io.lovable.app/auth'
        }
      })

      if (magicLinkError) {
        console.error('Error generating magic link:', magicLinkError)
        throw magicLinkError
      }

      signInLink = magicLinkData.properties.action_link
    } else {
      console.log('New user, sending invitation')
      // Invite new user
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(tenantEmail, {
        redirectTo: 'https://rental-haven-io.lovable.app/auth'
      })

      if (inviteError) {
        console.error('Error inviting user:', inviteError)
        throw inviteError
      }

      signInLink = inviteData.properties.action_link
    }

    console.log('Sending email via Resend with link:', signInLink)

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
        subject: '[TEST] Welcome to Rental Haven - Access Your Account',
        html: `
          <p>Hello ${tenantName},</p>
          <p>Welcome to Rental Haven! Your landlord has added you as a tenant for the property at ${propertyAddress}.</p>
          <p>To access your tenant portal, please click the link below:</p>
          <p><a href="${signInLink}">Access Your Account</a></p>
          <p>This link will expire in 24 hours.</p>
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