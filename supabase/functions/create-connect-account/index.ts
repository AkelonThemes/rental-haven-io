import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: 'individual',
    });

    console.log('Created Stripe Connect account:', account.id);

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get('origin')}/account?refresh=true`,
      return_url: `${req.headers.get('origin')}/account?success=true`,
      type: 'account_onboarding',
    });

    // Update the user's profile with the Connect account ID
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        stripe_connect_id: account.id,
        stripe_connect_status: 'pending',
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Connect account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});