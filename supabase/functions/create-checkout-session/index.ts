import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { creator_id } = await req.json();
    if (!creator_id) throw new Error("creator_id is required");
    logStep("Request body", { creator_id });

    // Fetch creator with Stripe price
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from("creators")
      .select("id, handle, stripe_price_id, price_usd, user_id, profiles:user_id(display_name)")
      .eq("id", creator_id)
      .single();

    if (creatorError || !creator) {
      throw new Error("Creator not found");
    }
    logStep("Creator found", { creatorId: creator.id, handle: creator.handle });

    if (!creator.stripe_price_id) {
      throw new Error("Creator has not set up Stripe pricing yet");
    }

    // Check if user is trying to subscribe to themselves
    if (creator.user_id === user.id) {
      throw new Error("You cannot subscribe to yourself");
    }

    // Check if already subscribed
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status")
      .eq("subscriber_id", user.id)
      .eq("creator_id", creator_id)
      .eq("status", "active")
      .maybeSingle();

    if (existingSub) {
      throw new Error("You already have an active subscription to this creator");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: creator.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/subscriptions?success=1&creator=${creator.handle}`,
      cancel_url: `${origin}/creator/${creator.handle}`,
      metadata: {
        subscriber_id: user.id,
        creator_id: creator_id,
      },
      subscription_data: {
        metadata: {
          subscriber_id: user.id,
          creator_id: creator_id,
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
