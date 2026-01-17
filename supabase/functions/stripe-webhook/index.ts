import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const PLATFORM_FEE_PERCENT = 0.25; // 25% platform fee

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    logStep("ERROR", { message: "STRIPE_SECRET_KEY not set" });
    return new Response("Server configuration error", { status: 500 });
  }

  // SECURITY FIX: Require webhook secret - never process unverified events
  if (!webhookSecret) {
    logStep("ERROR", { message: "STRIPE_WEBHOOK_SECRET not configured - rejecting request" });
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    let event: Stripe.Event;

    // SECURITY: Always verify webhook signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR", { message: "No stripe-signature header provided" });
      return new Response("Missing signature", { status: 401 });
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (signatureError) {
      const errorMessage = signatureError instanceof Error ? signatureError.message : String(signatureError);
      logStep("ERROR: Signature verification failed", { message: errorMessage });
      return new Response("Invalid signature", { status: 401 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, mode: session.mode });

        if (session.mode === "subscription" && session.subscription) {
          const subscriberId = session.metadata?.subscriber_id;
          const creatorId = session.metadata?.creator_id;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (!subscriberId || !creatorId) {
            logStep("ERROR", { message: "Missing metadata in session" });
            break;
          }

          // Fetch subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Upsert subscription in database
          const { data: subData, error } = await supabaseAdmin
            .from("subscriptions")
            .upsert({
              subscriber_id: subscriberId,
              creator_id: creatorId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: "active",
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: "subscriber_id,creator_id",
            })
            .select()
            .single();

          if (error) {
            logStep("ERROR upserting subscription", { error: error.message });
          } else {
            logStep("Subscription created/updated", { subscriberId, creatorId, subscriptionId: subData?.id });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        if (invoice.subscription && invoice.amount_paid > 0) {
          // Find the subscription in our database
          const { data: subscription } = await supabaseAdmin
            .from("subscriptions")
            .select("id, creator_id, subscriber_id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .maybeSingle();

          if (subscription) {
            const grossAmount = invoice.amount_paid / 100; // Convert cents to dollars
            const platformFee = grossAmount * PLATFORM_FEE_PERCENT;
            const netAmount = grossAmount - platformFee;

            // Record the earning
            const { error: earningsError } = await supabaseAdmin
              .from("creator_earnings")
              .insert({
                creator_id: subscription.creator_id,
                subscriber_id: subscription.subscriber_id,
                subscription_id: subscription.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                gross_amount: grossAmount,
                platform_fee: platformFee,
                net_amount: netAmount,
                status: "available", // Immediately available for withdrawal
              });

            if (earningsError) {
              logStep("ERROR recording earnings", { error: earningsError.message });
            } else {
              logStep("Earnings recorded", { 
                creatorId: subscription.creator_id, 
                gross: grossAmount, 
                net: netAmount,
                fee: platformFee 
              });
            }
          } else {
            logStep("No subscription found for invoice", { subscriptionId: invoice.subscription });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        const subscriberId = subscription.metadata?.subscriber_id;
        const creatorId = subscription.metadata?.creator_id;

        if (!subscriberId || !creatorId) {
          // Try to find by stripe_subscription_id
          const { data: existingSub } = await supabaseAdmin
            .from("subscriptions")
            .select("subscriber_id, creator_id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();

          if (existingSub) {
            const status = subscription.status === "active" ? "active" 
              : subscription.status === "past_due" ? "past_due" 
              : "canceled";

            await supabaseAdmin
              .from("subscriptions")
              .update({
                status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("stripe_subscription_id", subscription.id);

            logStep("Subscription updated by stripe_subscription_id", { status });
          }
        } else {
          const status = subscription.status === "active" ? "active" 
            : subscription.status === "past_due" ? "past_due" 
            : "canceled";

          await supabaseAdmin
            .from("subscriptions")
            .update({
              status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("subscriber_id", subscriberId)
            .eq("creator_id", creatorId);

          logStep("Subscription status updated", { subscriberId, creatorId, status });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        logStep("Subscription marked as canceled");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

        if (invoice.subscription) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string);

          logStep("Subscription marked as past_due");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
