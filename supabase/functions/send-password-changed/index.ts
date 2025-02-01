import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Password change notification function started')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userEmail } = await req.json()
    console.log('Received request to send notification to:', userEmail)

    if (!userEmail) {
      throw new Error('No email address provided')
    }

    // During testing phase, redirect all emails to the verified email
    const testingEmail = 'ensolute@gmail.com'
    const isTestingPhase = true // Set this to false after domain verification

    console.log('Preparing to send email via Resend')
    console.log('Using testing email:', isTestingPhase ? testingEmail : userEmail)

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Send email using Resend
    const emailResponse = await resend.emails.send({
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

    console.log('Resend API response:', emailResponse)

    if (!emailResponse) {
      throw new Error('Failed to send password change notification')
    }

    console.log('Email sent successfully')

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