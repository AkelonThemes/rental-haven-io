// @ts-ignore: Deno imports
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno imports
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
// @ts-ignore: Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno&no-check";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
        const paymentId = paymentIntent.metadata.payment_id;

        // Update payment status
        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({
            status: 'completed',
            payment_date: new Date().toISOString(),
          })
          .eq('id', paymentId);

        if (updateError) throw updateError;
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.metadata.payment_id;

        // Update payment status
        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({
            status: 'failed',
          })
          .eq('id', paymentId);

        if (updateError) throw updateError;
        break;
      }

      case 'transfer.paid': {
        const transfer = event.data.object;
        const paymentId = transfer.metadata.payment_id;

        // Update transfer status
        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({
            transfer_status: 'completed',
            stripe_transfer_id: transfer.id,
          })
          .eq('id', paymentId);

        if (updateError) throw updateError;
        break;
      }

      case 'transfer.failed': {
        const transfer = event.data.object;
        const paymentId = transfer.metadata.payment_id;

        // Update transfer status
        const { error: updateError } = await supabaseClient
          .from('payments')
          .update({
            transfer_status: 'failed',
            stripe_transfer_id: transfer.id,
          })
          .eq('id', paymentId);

        if (updateError) throw updateError;
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});