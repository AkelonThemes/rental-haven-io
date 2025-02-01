import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

async function testEnvironmentVariables() {
  console.log("Testing environment variables...\n");

  // Test Stripe variables
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log("Stripe Configuration:");
  console.log("- Secret Key:", stripeKey ? "✅ Present" : "❌ Missing");
  console.log("- Webhook Secret:", webhookSecret ? "✅ Present" : "❌ Missing");

  // Test Stripe connection and webhook
  try {
    if (!stripeKey) throw new Error("Stripe key is missing");
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Test basic Stripe connection
    const balance = await stripe.balance.retrieve();
    console.log("- Stripe Connection: ✅ Success");

    // Test webhook signature verification
    if (webhookSecret) {
      try {
        const testPayload = JSON.stringify({ type: 'test_event' });
        const testTimestamp = Math.floor(Date.now() / 1000);
        
        const signature = stripe.webhooks.generateTestHeaderString({
          payload: testPayload,
          secret: webhookSecret,
          timestamp: testTimestamp,
        });
        
        await stripe.webhooks.constructEventAsync(
          testPayload,
          signature,
          webhookSecret
        );
        console.log("- Webhook Secret Verification: ✅ Success");
      } catch (error: any) {
        console.log("- Webhook Secret Verification: ❌ Failed");
        console.error("  Error:", error.message);
      }
    }
  } catch (error: any) {
    console.log("- Stripe Connection: ❌ Failed");
    console.error("  Error:", error.message);
  }

  // Test Supabase variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("\nSupabase Configuration:");
  console.log("- URL:", supabaseUrl ? "✅ Present" : "❌ Missing");
  console.log("- Anon Key:", supabaseAnonKey ? "✅ Present" : "❌ Missing");
  console.log("- Service Role Key:", supabaseServiceKey ? "✅ Present" : "❌ Missing");

  // Test Supabase connection
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is missing");
    }
    
    const { data, error } = await supabase.from("subscriptions").select("count");
    if (error) throw error;
    console.log("- Supabase Connection: ✅ Success");
  } catch (error: any) {
    console.log("- Supabase Connection: ❌ Failed");
    console.error("  Error:", error.message);
  }
}

testEnvironmentVariables();