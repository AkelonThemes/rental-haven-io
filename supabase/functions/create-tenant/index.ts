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

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
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
    
    console.log('Creating or fetching auth user for:', tenantData.email)
    
    // First check if user already exists
    const { data: existingUser, error: searchError } = await supabase.auth.admin.listUsers({
      filter: {
        email: tenantData.email
      }
    })

    if (searchError) {
      console.error('Error searching for existing user:', searchError)
      throw searchError
    }

    let userId
    let password = ''

    if (existingUser.users.length > 0) {
      console.log('User already exists, using existing user')
      userId = existingUser.users[0].id
    } else {
      console.log('Creating new user')
      password = generatePassword()
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tenantData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: tenantData.full_name,
          role: 'tenant'
        }
      })

      if (createError) {
        console.error('Error creating auth user:', createError)
        throw createError
      }

      if (!newUser.user) {
        throw new Error('No user returned from auth creation')
      }

      userId = newUser.user.id
    }

    console.log('User ID:', userId)

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Creating tenant record')

    // Create tenant record with the profile ID
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

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      throw tenantError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: userId,
        password: password // Only included if a new user was created
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