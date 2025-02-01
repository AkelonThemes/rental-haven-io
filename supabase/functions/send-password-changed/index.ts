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

    const { userEmail } = await req.json()

    console.log('Sending password change notification to:', userEmail)

    // During testing phase, redirect all emails to the verified email
    const testingEmail = 'ensolute@gmail.com'
    const isTestingPhase = true // Set this to false after domain verification

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Rental Haven <onboarding@resend.dev>',
        to: isTestingPhase ? testingEmail : userEmail,
        subject: 'Password Changed - Rental Haven',
        html: `
          <p>Hello,</p>
          ${isTestingPhase ? `<p><strong>Test Mode:</strong> This email was meant for ${userEmail}</p>` : ''}
          <p>This email is to confirm that your password has been successfully changed.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <p>Best regards,<br>The Rental Haven Team</p>
        `
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send password change notification: ${errorData}`)
    }

    const emailData = await emailResponse.json()
    console.log('Email sent successfully:', emailData)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-password-changed function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})