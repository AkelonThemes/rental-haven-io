
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'x-deno-subhost': 'hlljirnsimcmmuuhaurs',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'x-deno-subhost': 'hlljirnsimcmmuuhaurs'
      }
    });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!signature || !webhookSecret || !stripeKey) {
      throw new Error('Missing required configuration');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const body = await req.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw err;
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.mode === 'subscription') {
          console.log('Processing completed subscription checkout session');
          
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const customerId = session.customer;
          const userEmail = session.customer_email;
          
          if (!subscription.id) {
            throw new Error('No subscription ID returned from Stripe');
          }
          
          // Get the profile ID using the customer's email
          const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            throw profileError;
          }

          if (!profile) {
            throw new Error(`No profile found for email ${userEmail}`);
          }

          console.log('Found profile for subscription:', profile.id);

          // Create or update subscription record
          const { error: subscriptionError } = await supabaseClient
            .from('subscriptions')
            .upsert({
              profile_id: profile.id,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customerId,
              status: subscription.status,
              plan_type: 'standard',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: 'stripe_subscription_id'
            });

          if (subscriptionError) {
            console.error('Error creating subscription record:', subscriptionError);
            throw subscriptionError;
          }

          console.log('Successfully created subscription record');
        } else {
          // Handle regular payment completion
          const paymentId = session.metadata?.payment_id;
          console.log('Checkout session completed. Payment ID:', paymentId);

          if (!paymentId) {
            throw new Error('No payment_id found in metadata');
          }

          const { error: updateError } = await supabaseClient
            .from('payments')
            .update({
              status: 'completed',
              payment_date: new Date().toISOString(),
              landlord_payout_status: 'pending',
              stripe_payment_id: session.payment_intent
            })
            .eq('id', paymentId);

          if (updateError) {
            console.error('Error updating payment:', updateError);
            throw updateError;
          }

          console.log('Successfully updated payment status for ID:', paymentId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        if (!subscription.id) {
          throw new Error('No subscription ID in webhook event');
        }
        
        console.log('Processing subscription update:', subscription.id);

        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        console.log('Successfully updated subscription status');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        if (!subscription.id) {
          throw new Error('No subscription ID in webhook event');
        }
        
        console.log('Processing subscription deletion:', subscription.id);

        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled'
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription status to canceled:', updateError);
          throw updateError;
        }

        console.log('Successfully marked subscription as canceled');
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const paymentId = session.metadata?.payment_id;

        console.log('Checkout session expired. Payment ID:', paymentId);

        if (!paymentId) {
          throw new Error('No payment_id found in metadata');
        }

        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({
            status: 'failed',
            stripe_payment_id: session.payment_intent
          })
          .eq('id', paymentId);

        if (updateError) {
          console.error('Error updating payment:', updateError);
          throw updateError;
        }

        console.log('Successfully updated payment status to failed for ID:', paymentId);
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }), 
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'x-deno-subhost': 'hlljirnsimcmmuuhaurs'
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'x-deno-subhost': 'hlljirnsimcmmuuhaurs'
        },
        status: 500,
      }
    );
  }
});
