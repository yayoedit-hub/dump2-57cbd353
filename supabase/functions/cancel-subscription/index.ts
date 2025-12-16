import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { subscription_id } = await req.json();
    if (!subscription_id) throw new Error("subscription_id is required");
    logStep("Request body", { subscription_id });

    // Verify the subscription belongs to this user
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_subscription_id, subscriber_id")
      .eq("id", subscription_id)
      .eq("subscriber_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found or does not belong to you");
    }

    if (!subscription.stripe_subscription_id) {
      throw new Error("No Stripe subscription ID found");
    }

    logStep("Found subscription", { stripeSubId: subscription.stripe_subscription_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Cancel at period end (user keeps access until end of billing period)
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    logStep("Subscription set to cancel at period end", { 
      currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000).toISOString() 
    });

    // Update local status to reflect pending cancellation
    await supabaseAdmin
      .from("subscriptions")
      .update({ 
        status: "canceled",
        current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString()
      })
      .eq("id", subscription_id);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      cancel_at: new Date(canceledSubscription.current_period_end * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
