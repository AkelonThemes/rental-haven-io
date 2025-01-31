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

    // Get user by email using the correct method
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', tenantEmail)
      .single()
    
    if (userError) {
      console.error('Error getting user:', userError)
      throw userError
    }

    // Generate a magic link for the user
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.inviteUserByEmail(tenantEmail, {
      redirectTo: 'https://rental-haven-io.lovable.app/auth'
    })

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError)
      throw magicLinkError
    }

    // Send email with magic link using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Rental Haven <onboarding@resend.dev>',
        to: tenantEmail,
        subject: 'Welcome to Rental Haven - Set Up Your Account',
        html: `
          <p>Hello ${tenantName},</p>
          <p>Welcome to Rental Haven! Your landlord has added you as a tenant for the property at ${propertyAddress}.</p>
          <p>To access your tenant portal, please click the link below to set up your account:</p>
          <p><a href="${magicLinkData?.properties?.action_link}">Set Up Your Account</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The Rental Haven Team</p>
        `
      })
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Error sending email:', error)
      throw new Error('Failed to send welcome email')
    }

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