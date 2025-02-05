import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno&no-check";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'x-deno-subhost': 'hlljirnsimcmmuuhaurs'
};

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
  throw new Error('Missing required configuration');
}

const supabaseClient = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting payment process...');
    const { payment_id } = await req.json();
    
    if (!payment_id) {
      throw new Error('Payment ID is required');
    }

    console.log('Payment ID:', payment_id);

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select(`
        *,
        tenant:tenants(
          profile:profiles(full_name)
        ),
        property:properties(address)
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      console.error('Error fetching payment:', paymentError);
      throw new Error('Payment not found');
    }

    console.log('Payment details:', payment);

    // Get user information
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Creating Stripe Checkout session...');

    // Create Stripe session
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
          unit_amount: Math.round(payment.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${new URL(req.url).origin}/tenant-dashboard?success=true`,
      cancel_url: `${new URL(req.url).origin}/tenant-dashboard?canceled=true`,
      metadata: {
        payment_id: payment.id,
      },
      customer_email: user.email,
    });

    console.log('Checkout session created:', session.url);

    // Update payment record with Stripe session ID
    await supabaseClient
      .from('payments')
      .update({ stripe_payment_id: session.id })
      .eq('id', payment_id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-tenant-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});