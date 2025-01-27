// @ts-ignore: Deno imports
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno imports
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
// @ts-ignore: Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno&no-check";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe key not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get request body
    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    console.log('Attempting to cancel subscription:', subscriptionId);

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    try {
      // First verify the subscription exists and belongs to the user
      const { data: subscription, error: dbError } = await supabaseClient
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .eq('profile_id', user.id)
        .single();

      if (dbError || !subscription) {
        console.error('Subscription not found in database:', dbError);
        throw new Error('Subscription not found');
      }

      // Cancel the subscription in Stripe
      const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      console.log('Stripe subscription canceled:', canceledSubscription.id);

      // Update subscription status in database
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({ 
          status: 'canceled',
          current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)
        .eq('profile_id', user.id);

      if (updateError) {
        console.error('Error updating subscription in database:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({ 
          message: 'Subscription cancelled successfully',
          subscription: canceledSubscription
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      // If the subscription doesn't exist in Stripe but exists in our DB,
      // we should still mark it as canceled
      if (stripeError.code === 'resource_missing') {
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscriptionId)
          .eq('profile_id', user.id);

        if (updateError) {
          console.error('Error updating subscription in database:', updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({ 
            message: 'Subscription marked as cancelled in database',
            warning: 'Subscription not found in Stripe'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      throw stripeError;
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});