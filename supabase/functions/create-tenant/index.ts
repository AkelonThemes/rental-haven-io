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
    
    console.log('Checking for existing user with email:', tenantData.email)
    
    // First, check if a user with this email already exists in auth.users
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
    if (getUserError) throw getUserError

    const existingUser = users.find(user => user.email === tenantData.email)
    let userId: string

    if (existingUser) {
      // If user exists, use their ID
      userId = existingUser.id
      console.log('Using existing user:', userId)

      // Update their role to tenant if needed
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ role: 'tenant' })
        .eq('id', userId)

      if (updateProfileError) throw updateProfileError
    } else {
      // Create auth user for tenant if they don't exist
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: tenantData.email,
        email_confirm: true,
        user_metadata: {
          full_name: tenantData.full_name,
          role: 'tenant'
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create auth user')

      userId = authData.user.id
      console.log('Created new user:', userId)

      // Create profile for new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: tenantData.full_name,
          role: 'tenant'
        })

      if (profileError) throw profileError
    }

    // Create tenant record
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        profile_id: userId,
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