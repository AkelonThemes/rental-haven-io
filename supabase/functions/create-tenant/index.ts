import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface TenantData {
  full_name: string
  email: string
  password: string
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
    
    // Create auth user for tenant
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tenantData.email,
      password: tenantData.password,
      email_confirm: true,
      user_metadata: {
        full_name: tenantData.full_name,
        role: 'tenant'
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create auth user')

    // Create profile if it doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: tenantData.full_name,
        role: 'tenant'
      })
      .select()
      .single()

    if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
      throw profileError
    }

    // Create tenant record
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        profile_id: authData.user.id,
        property_id: tenantData.property_id,
        lease_start_date: tenantData.lease_start_date,
        lease_end_date: tenantData.lease_end_date,
        rent_amount: parseFloat(tenantData.rent_amount),
        created_by: tenantData.created_by
      })

    if (tenantError) throw tenantError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})