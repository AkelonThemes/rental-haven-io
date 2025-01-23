import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret', {
        signature_exists: !!signature,
        webhook_secret_exists: !!webhookSecret
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing signature or webhook secret',
          signature_present: !!signature,
          secret_present: !!webhookSecret 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the raw body
    const body = await req.text();
    
    console.log('Received webhook request', {
      signature_exists: !!signature,
      body_length: body.length,
    });

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
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

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
      }
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        }
      }
    );
  }
});