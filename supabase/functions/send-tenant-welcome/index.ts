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

    // Check if user already exists by listing users and filtering
    const { data: users, error: lookupError } = await supabase.auth.admin.listUsers()
    
    if (lookupError) {
      console.error('Error looking up users:', lookupError)
      throw lookupError
    }

    const existingUser = users.users.find(user => user.email === tenantEmail)
    let tempPassword = ''

    if (!existingUser) {
      // Generate a temporary password only for new users
      tempPassword = crypto.randomUUID().slice(0, 12)

      // Create the auth user with the temporary password
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: tenantEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: tenantName,
          role: 'tenant'
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        throw authError
      }

      console.log('Created new auth user:', authUser.user?.id)
    } else {
      console.log('User already exists:', existingUser.id)
      // For existing users, we'll generate a password reset link
      const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: tenantEmail,
      })

      if (resetError) {
        console.error('Error generating reset link:', resetError)
        throw resetError
      }

      tempPassword = 'A password reset link has been sent to your email'
    }

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
        subject: '[TEST] Welcome to Rental Haven - Your Login Credentials',
        html: `
          <p>Hello ${tenantName},</p>
          <p>Welcome to Rental Haven! Your landlord has added you as a tenant for the property at ${propertyAddress}.</p>
          ${!existingUser ? `
          <p>Here are your temporary login credentials:</p>
          <ul>
            <li><strong>Email:</strong> ${tenantEmail}</li>
            <li><strong>Temporary Password:</strong> ${tempPassword}</li>
          </ul>
          ` : `
          <p>Since you already have an account, we've sent a password reset link to your email address.</p>
          `}
          <p>Please use these credentials to log in at the link below:</p>
          <p><a href="${signUpLink}">Access Your Account</a></p>
          <p><strong>Important:</strong> For security reasons, please change your password after your first login.</p>
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