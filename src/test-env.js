var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
require('dotenv').config();
var createClient = require('@supabase/supabase-js').createClient;
var Stripe = require('stripe');
var supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
function testEnvironmentVariables() {
    return __awaiter(this, void 0, void 0, function () {
        var stripeKey, webhookSecret, stripe, balance, error_1, supabaseUrl, supabaseAnonKey, supabaseServiceKey, _a, data, error, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Testing environment variables...\n");
                    stripeKey = process.env.STRIPE_SECRET_KEY;
                    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
                    console.log("Stripe Configuration:");
                    console.log("- Secret Key:", stripeKey ? "✅ Present" : "❌ Missing");
                    console.log("- Webhook Secret:", webhookSecret ? "✅ Present" : "❌ Missing");
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    stripe = new Stripe(stripeKey || "", {
                        apiVersion: "2023-10-16",
                    });
                    return [4 /*yield*/, stripe.balance.retrieve()];
                case 2:
                    balance = _b.sent();
                    console.log("- Stripe Connection: ✅ Success");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    console.log("- Stripe Connection: ❌ Failed");
                    console.error("  Error:", error_1.message);
                    return [3 /*break*/, 4];
                case 4:
                    supabaseUrl = process.env.SUPABASE_URL;
                    supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
                    supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    console.log("\nSupabase Configuration:");
                    console.log("- URL:", supabaseUrl ? "✅ Present" : "❌ Missing");
                    console.log("- Anon Key:", supabaseAnonKey ? "✅ Present" : "❌ Missing");
                    console.log("- Service Role Key:", supabaseServiceKey ? "✅ Present" : "❌ Missing");
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, supabase.from("subscriptions").select("count")];
                case 6:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    console.log("- Supabase Connection: ✅ Success");
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _b.sent();
                    console.log("- Supabase Connection: ❌ Failed");
                    console.error("  Error:", error_2.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
testEnvironmentVariables();
