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
    const signInLink = `https://rental-haven-io.lovable.app/auth`

    console.log('Sending email via Resend with link:', signInLink)

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
        from: 'Rental Haven <noreply@gukoya.com>',
        to: isTestingPhase ? testingEmail : tenantEmail,
        subject: 'Welcome to Rental Haven - Your Login Credentials',
        html: `
          <p>Hello ${tenantName},</p>
          <p>Welcome to Rental Haven! Your landlord has added you as a tenant for the property at ${propertyAddress}.</p>
          ${isTestingPhase ? `<p><strong>Test Mode:</strong> This email was meant for ${tenantEmail}</p>` : ''}
          <p>Here are your login credentials:</p>
          <ul>
            <li><strong>Email:</strong> ${tenantEmail}</li>
            <li><strong>Password:</strong> ${tempPassword}</li>
          </ul>
          <p>Please use these credentials to log in at:</p>
          <p><a href="${signInLink}">Sign In to Your Account</a></p>
          ${!existingUser ? `
          <p><strong>Important:</strong> For security reasons, we recommend changing your password after your first login.</p>
          ` : `
          <p>Since you already have an account, we've sent a password reset link to your email address.</p>
          `}
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