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

    let userId: string
    let password: string | undefined

    // If user exists, check their role
    if (existingUser.users.length > 0) {
      userId = existingUser.users[0].id
      
      // Check user's role in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        throw profileError
      }

      if (profileData.role === 'landlord') {
        return new Response(
          JSON.stringify({ 
            error: 'Cannot add a landlord as a tenant. The user must create a separate account with a different email for tenant access.'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Update existing user's profile to ensure tenant role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'tenant',
          full_name: tenantData.full_name
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw updateError
      }

      console.log('Updated existing user profile')
    } else {
      // Create new user as tenant
      console.log('Creating new tenant user')
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

      // Wait for the trigger to complete profile creation
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Ensure profile is updated with tenant role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'tenant',
          full_name: tenantData.full_name
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw updateError
      }
    }

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
        password // Only included if a new user was created
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