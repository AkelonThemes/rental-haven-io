import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('Webhook secret exists:', !!webhookSecret);
    console.log('Stripe key exists:', !!stripeKey);
    console.log('Signature exists:', !!signature);

    if (!signature || !webhookSecret || !stripeKey) {
      console.error('Missing required configuration', {
        signature_exists: !!signature,
        webhook_secret_exists: !!webhookSecret,
        stripe_key_exists: !!stripeKey
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required configuration',
          details: {
            signature: !!signature,
            webhook_secret: !!webhookSecret,
            stripe_key: !!stripeKey
          }
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Get the raw body
    const body = await req.text();
    
    console.log('Received webhook request', {
      signature_exists: !!signature,
      body_length: body.length,
      webhook_secret_exists: !!webhookSecret
    });

    // Verify the webhook signature using constructEventAsync
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Received Stripe event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const customerId = session.customer as string;
        const userId = subscription.metadata.user_id;

        console.log('Processing completed checkout session:', {
          session_id: session.id,
          customer_id: customerId,
          user_id: userId
        });

        // Update subscription in database
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .upsert({
            profile_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            plan_type: 'pro',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        // Create payment record
        const { error: paymentError } = await supabaseClient
          .from('payments')
          .insert({
            amount: session.amount_total ? session.amount_total / 100 : 0,
            payment_type: 'subscription',
            status: 'completed',
            stripe_payment_id: session.payment_intent as string,
            payer_profile_id: userId,
          });

        if (paymentError) {
          console.error('Error creating payment record:', paymentError);
          throw paymentError;
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;

        console.log('Processing subscription update:', {
          subscription_id: subscription.id,
          user_id: userId,
          status: subscription.status
        });

        const { error } = await supabaseClient
          .from('subscriptions')
          .upsert({
            profile_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});