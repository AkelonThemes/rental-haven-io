import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno&no-check";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-deno-subhost',
  'x-deno-subhost': 'hlljirnsimcmmuuhaurs',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'x-deno-subhost': 'hlljirnsimcmmuuhaurs'
      }
    });
  }

  try {
    console.log('Starting payment process...');

    // Validate request body
    const body = await req.json();
    console.log('Request body:', body);

    if (!body?.payment_id) {
      throw new Error('Payment ID is required');
    }

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
          owner:profiles(
            full_name
          )
        )
      `)
      .eq('id', body.payment_id)
      .single();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      throw new Error('Failed to fetch payment details');
    }

    if (!payment) {
      throw new Error('Payment not found');
    }

    console.log('Payment details:', payment);

    // Validate payment amount
    if (!payment.amount || payment.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Get user information for the tenant
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('User found:', user.email);

    // Calculate platform fee
    const platformFeePercentage = payment.platform_fee_percentage || 2.0;
    const platformFeeAmount = Math.round((payment.amount * platformFeePercentage) / 100);
    const amountInCents = Math.round(payment.amount * 100);

    console.log('Creating Stripe Checkout session...');
    console.log('Amount:', payment.amount, 'Platform fee:', platformFeeAmount);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Create Checkout Session with proper URL handling
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
      success_url: `${new URL(req.url).origin}/tenant-dashboard?success=true`,
      cancel_url: `${new URL(req.url).origin}/tenant-dashboard?canceled=true`,
      metadata: {
        payment_id: payment.id,
        property_id: payment.property_id,
        tenant_id: payment.tenant_id,
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
        })
        .eq('id', body.payment_id);

      if (updateError) {
        console.error('Error updating payment record:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ url: session.url }),
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
    console.error('Error in create-tenant-payment:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
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