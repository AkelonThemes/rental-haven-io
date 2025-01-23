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

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY is not set in environment variables');
    return new Response(
      JSON.stringify({ error: 'Stripe key not configured' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    const email = user?.email;

    if (!email) {
      throw new Error('No email found');
    }

    console.log('Initializing Stripe with key length:', stripeKey.length);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    const price_id = "price_1QkPnyBZnQTVE0K5jo0Lr9cd";  // Your test price ID

    let customer_id = undefined;
    if (customers.data.length > 0) {
      customer_id = customers.data[0].id;
      // Check if already subscribed to this price
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'active',
        price: price_id,
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        throw new Error("Customer already has an active subscription");
      }
    }

    console.log('Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customer_id,
      customer_email: customer_id ? undefined : email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/account`,
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    // Create a pending subscription record
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .insert({
        profile_id: user.id,
        plan_type: 'pro', // Adjust based on your plan types
        status: 'pending',
        stripe_customer_id: customer_id,
      });

    if (subscriptionError) {
      console.error('Error creating subscription record:', subscriptionError);
    }

    console.log('Checkout session created:', session.id);
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});