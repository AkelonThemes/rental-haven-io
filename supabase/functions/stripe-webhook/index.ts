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

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return new Response(
      JSON.stringify({ error: 'Missing signature or webhook secret' }),
      { status: 400 }
    );
  }

  try {
    const body = await req.text();
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

        console.log('Processing completed checkout session:', session.id);

        // Update subscription in database
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .upsert({
            profile_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            plan_type: 'pro', // Adjust based on your plan types
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (updateError) {
          console.error('Error updating subscription:', updateError);
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
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;

        console.log('Processing subscription update:', subscription.id);

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
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: 'Webhook error' }),
      { status: 400 }
    );
  }
});