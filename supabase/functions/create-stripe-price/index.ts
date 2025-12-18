import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-PRICE] ${step}${detailsStr}`);
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

    const { creator_id, price_usd } = await req.json();
    if (!creator_id || price_usd === undefined || price_usd === null || price_usd < 1) {
      throw new Error("creator_id is required and price_usd must be at least $1 for Stripe subscriptions");
    }
    logStep("Request body", { creator_id, price_usd });

    // Verify the creator belongs to this user
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from("creators")
      .select("id, handle, stripe_product_id, user_id, profiles:user_id(display_name)")
      .eq("id", creator_id)
      .eq("user_id", user.id)
      .single();

    if (creatorError || !creator) {
      throw new Error("Creator not found or does not belong to you");
    }

    logStep("Found creator", { creatorId: creator.id, handle: creator.handle });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const displayName = (creator.profiles as any)?.display_name || creator.handle;

    let productId = creator.stripe_product_id;

    // Create product if it doesn't exist
    if (!productId) {
      const product = await stripe.products.create({
        name: `${displayName} - Dump Subscription`,
        description: `Monthly subscription to ${displayName}'s Dump library`,
        metadata: {
          creator_id: creator.id,
          handle: creator.handle,
        },
      });
      productId = product.id;
      logStep("Created Stripe product", { productId });
    }

    // Always create a new price (Stripe prices are immutable)
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(price_usd * 100), // Convert to cents
      currency: "usd",
      recurring: {
        interval: "month",
      },
      metadata: {
        creator_id: creator.id,
      },
    });
    logStep("Created Stripe price", { priceId: price.id, amount: price_usd });

    // Update creator with new Stripe IDs
    const { error: updateError } = await supabaseAdmin
      .from("creators")
      .update({
        stripe_product_id: productId,
        stripe_price_id: price.id,
        price_usd: price_usd,
      })
      .eq("id", creator_id);

    if (updateError) {
      throw new Error(`Failed to update creator: ${updateError.message}`);
    }

    logStep("Updated creator with Stripe IDs");

    return new Response(JSON.stringify({ 
      success: true,
      stripe_product_id: productId,
      stripe_price_id: price.id,
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
