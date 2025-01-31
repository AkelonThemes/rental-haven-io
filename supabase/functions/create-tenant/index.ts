import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface TenantData {
  full_name: string
  email: string
  property_id: string
  lease_start_date: string
  lease_end_date: string
  rent_amount: string
  created_by: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { tenantData } = await req.json() as { tenantData: TenantData }
    
    console.log('Creating tenant profile for:', tenantData.email)
    
    // First create the user in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: tenantData.email,
      email_confirm: true,
      user_metadata: {
        full_name: tenantData.full_name,
        role: 'tenant'
      }
    })

    if (userError) {
      console.error('Error creating user:', userError)
      throw userError
    }

    if (!userData.user) {
      throw new Error('Failed to create user')
    }

    console.log('Created user:', userData.user.id)

    // The profile will be created automatically by the handle_new_user trigger
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create tenant record with the new user's profile ID
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        profile_id: userData.user.id,
        property_id: tenantData.property_id,
        lease_start_date: tenantData.lease_start_date,
        lease_end_date: tenantData.lease_end_date,
        rent_amount: parseFloat(tenantData.rent_amount),
        created_by: tenantData.created_by
      })

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      throw tenantError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: userData.user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-tenant function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})