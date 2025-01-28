var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

require('dotenv').config();
var createClient = require('@supabase/supabase-js').createClient;
var Stripe = require('stripe');

var supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

function testEnvironmentVariables() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Testing environment variables...\n");
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        console.log("Stripe Configuration:");
        console.log("- Secret Key:", stripeKey ? "✅ Present" : "❌ Missing");
        console.log("- Webhook Secret:", webhookSecret ? "✅ Present" : "❌ Missing");
        try {
            const stripe = new Stripe(stripeKey || "", {
                apiVersion: "2025-01-27.acacia",
            });
            const balance = yield stripe.balance.retrieve();
            console.log("- Stripe Connection: ✅ Success");
        }
        catch (error) {
            console.log("- Stripe Connection: ❌ Failed");
            console.error("  Error:", error.message);
        }
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log("\nSupabase Configuration:");
        console.log("- URL:", supabaseUrl ? "✅ Present" : "❌ Missing");
        console.log("- Anon Key:", supabaseAnonKey ? "✅ Present" : "❌ Missing");
        console.log("- Service Role Key:", supabaseServiceKey ? "✅ Present" : "❌ Missing");
        try {
            const { data, error } = yield supabase.from("subscriptions").select("count");
            if (error)
                throw error;
            console.log("- Supabase Connection: ✅ Success");
        }
        catch (error) {
            console.log("- Supabase Connection: ❌ Failed");
            console.error("  Error:", error.message);
        }
    });
}

testEnvironmentVariables();