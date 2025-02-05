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
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.metadata?.payment_id;

        console.log('Payment succeeded. Payment ID:', paymentId);

        if (!paymentId) {
          throw new Error('No payment_id found in metadata');
        }

        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({
            status: 'completed',
            payment_date: new Date().toISOString(),
            landlord_payout_status: 'pending',
            stripe_payment_id: paymentIntent.id
          })
          .eq('id', paymentId);

        if (updateError) {
          console.error('Error updating payment:', updateError);
          throw updateError;
        }

        console.log('Successfully updated payment status for ID:', paymentId);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.metadata?.payment_id;

        console.log('Payment failed. Payment ID:', paymentId);

        if (!paymentId) {
          throw new Error('No payment_id found in metadata');
        }

        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({
            status: 'failed',
            stripe_payment_id: paymentIntent.id
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