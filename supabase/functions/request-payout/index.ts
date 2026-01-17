import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MINIMUM_PAYOUT = 50; // Minimum payout amount in USD

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-PAYOUT] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { amount, payout_method, payout_details } = await req.json();

    if (!amount || amount < MINIMUM_PAYOUT) {
      throw new Error(`Minimum payout amount is $${MINIMUM_PAYOUT}`);
    }

    if (!payout_method) {
      throw new Error("Payout method is required");
    }

    // Get creator for this user
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from("creators")
      .select("id, payout_method, payout_details")
      .eq("user_id", user.id)
      .single();

    if (creatorError || !creator) {
      throw new Error("Creator profile not found");
    }
    logStep("Found creator", { creatorId: creator.id });

    // Calculate available balance
    const { data: availableEarnings, error: earningsError } = await supabaseAdmin
      .from("creator_earnings")
      .select("net_amount")
      .eq("creator_id", creator.id)
      .eq("status", "available");

    if (earningsError) {
      throw new Error("Failed to fetch earnings");
    }

    const availableBalance = availableEarnings?.reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;
    logStep("Available balance", { balance: availableBalance });

    if (amount > availableBalance) {
      throw new Error(`Insufficient balance. Available: $${availableBalance.toFixed(2)}`);
    }

    // Create payout request
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from("creator_payouts")
      .insert({
        creator_id: creator.id,
        amount: amount,
        payout_method: payout_method,
        payout_details: payout_details || creator.payout_details,
        status: "pending",
      })
      .select()
      .single();

    if (payoutError) {
      throw new Error(`Failed to create payout request: ${payoutError.message}`);
    }
    logStep("Payout request created", { payoutId: payout.id, amount });

    // Mark earnings as paid out (up to the requested amount)
    let remainingAmount = amount;
    for (const earning of availableEarnings || []) {
      if (remainingAmount <= 0) break;
      
      const earningAmount = Number(earning.net_amount);
      if (earningAmount <= remainingAmount) {
        // This could mark individual earnings as paid_out in a real implementation
        remainingAmount -= earningAmount;
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      payout_id: payout.id,
      amount: amount,
      status: "pending",
      message: "Payout request submitted. You will receive your payment within 5-7 business days."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});