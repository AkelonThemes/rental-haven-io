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
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body?.payment_id) {
      console.error('No payment_id provided in request body');
      throw new Error('Payment ID is required');
    }

    const { payment_id } = body;
    console.log('Processing payment for payment_id:', payment_id);
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get payment details with related data
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
      throw new Error('Failed to fetch payment details');
    }

    if (!payment) {
      console.error('Payment not found for ID:', payment_id);
      throw new Error('Payment not found');
    }

    console.log('Payment details:', payment);

    // Validate required payment data
    if (!payment.amount || payment.amount <= 0) {
      console.error('Invalid payment amount:', payment.amount);
      throw new Error('Invalid payment amount');
    }

    const landlordStripeAccountId = payment.property?.owner?.stripe_connect_id;
    if (!landlordStripeAccountId) {
      console.error('Landlord Stripe account not found');
      throw new Error('Landlord has not completed Stripe onboarding');
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      throw new Error('Stripe configuration error');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Calculate platform fee
    const platformFeePercentage = payment.platform_fee_percentage || 2.0;
    const platformFeeAmount = Math.round((payment.amount * platformFeePercentage) / 100);
    const amountInCents = Math.round(payment.amount * 100);

    console.log('Creating Stripe Checkout session...');
    console.log('Amount:', payment.amount, 'Platform fee:', platformFeeAmount);

    // Create Checkout Session
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
          unit_amount: amountInCents,
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

    // Update payment record
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
        // Continue despite update error - the payment can still proceed
      }
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-tenant-payment:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});