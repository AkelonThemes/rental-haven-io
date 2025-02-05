import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    console.log('Starting payment process...');

    const body = await req.json();
    console.log('Request body:', body);

    if (!body?.payment_id) {
      throw new Error('Payment ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

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

    if (!payment.amount || payment.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('User found:', user.email);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    console.log('Creating Stripe Checkout session...');

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