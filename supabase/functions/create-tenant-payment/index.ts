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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id } = await req.json();
    console.log('Processing payment for payment_id:', payment_id);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        tenant:tenants(
          profile:profiles(full_name)
        ),
        property:properties(
          address,
          owner:profiles(stripe_connect_id)
        )
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      throw new Error('Payment not found');
    }

    if (!payment) {
      console.error('Payment not found');
      throw new Error('Payment not found');
    }

    console.log('Payment details:', payment);

    const landlordStripeAccountId = payment.property?.owner?.stripe_connect_id;
    if (!landlordStripeAccountId) {
      console.error('Landlord has not completed Stripe onboarding');
      throw new Error('Landlord has not completed Stripe onboarding');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Calculate platform fee (2% by default)
    const platformFeePercentage = payment.platform_fee_percentage || 2.0;
    const platformFeeAmount = Math.round((payment.amount * platformFeePercentage) / 100);

    console.log('Creating Stripe Checkout session...');

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Rent Payment - ${payment.property?.address || 'Property'}`,
            description: payment.tenant?.profile?.full_name 
              ? `Payment for ${payment.tenant.profile.full_name}`
              : undefined,
          },
          unit_amount: Math.round(payment.amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payments?success=true`,
      cancel_url: `${req.headers.get('origin')}/payments?canceled=true`,
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: landlordStripeAccountId,
        },
        metadata: {
          payment_id: payment.id,
          property_id: payment.property_id,
          tenant_id: payment.tenant_id,
        },
      },
    });

    console.log('Checkout session created:', session.url);

    // Update payment record with Stripe payment intent ID
    if (session.payment_intent) {
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({
          stripe_payment_id: session.payment_intent.toString(),
          platform_fee_amount: platformFeeAmount,
          landlord_stripe_account_id: landlordStripeAccountId,
        })
        .eq('id', payment_id);

      if (updateError) {
        console.error('Error updating payment record:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        url: session.url,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});