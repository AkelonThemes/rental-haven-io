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
    
    // First, create a profile for the tenant
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(), // Generate a UUID for the profile
        full_name: tenantData.full_name,
        role: 'tenant'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      throw profileError
    }
    
    if (!profileData) {
      throw new Error('Failed to create profile')
    }

    console.log('Created profile:', profileData.id)

    // Create tenant record with the new profile ID
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        profile_id: profileData.id,
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
        profileId: profileData.id 
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