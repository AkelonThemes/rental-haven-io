import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting payment process...');

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Server configuration error');
    }

    if (!stripeSecretKey) {
      console.error('Missing Stripe configuration');
      throw new Error('Stripe configuration error');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Validate request body
    const body = await req.json().catch(() => null);
    console.log('Request body:', body);

    if (!body?.payment_id) {
      console.error('No payment_id provided in request body');
      throw new Error('Payment ID is required');
    }

    const { payment_id } = body;
    console.log('Processing payment for payment_id:', payment_id);

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
          owner:profiles(
            stripe_connect_id,
            stripe_connect_status,
            stripe_connect_onboarding_completed
          )
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
    const onboardingCompleted = payment.property?.owner?.stripe_connect_onboarding_completed;
    const connectStatus = payment.property?.owner?.stripe_connect_status;

    if (!landlordStripeAccountId) {
      console.error('Landlord Stripe account not found');
      throw new Error('Landlord has not set up their Stripe Connect account');
    }

    if (!onboardingCompleted) {
      console.error('Landlord Stripe onboarding not completed');
      throw new Error('Landlord has not completed Stripe onboarding');
    }

    if (connectStatus !== 'active') {
      console.error('Landlord Stripe account not active:', connectStatus);
      throw new Error(`Landlord's Stripe account status is ${connectStatus}. Please contact support.`);
    }

    // Get user information
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Error getting user:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User found:', user.email);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Calculate platform fee
    const platformFeePercentage = payment.platform_fee_percentage || 2.0;
    const platformFeeAmount = Math.round((payment.amount * platformFeePercentage) / 100);
    const amountInCents = Math.round(payment.amount * 100);

    console.log('Creating Stripe Checkout session...');
    console.log('Amount:', payment.amount, 'Platform fee:', platformFeeAmount);
    console.log('Landlord Stripe Account:', landlordStripeAccountId);

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
      customer_email: user.email,
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