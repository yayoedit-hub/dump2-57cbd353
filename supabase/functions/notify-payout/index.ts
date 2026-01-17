import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Dump <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
  
  return response.json();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyPayoutRequest {
  payout_id: string;
  status: "completed" | "failed";
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-payout function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the user is an admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error("Admin access required");
    }

    const { payout_id, status, notes }: NotifyPayoutRequest = await req.json();
    console.log("Processing payout notification:", { payout_id, status });

    // Get payout details with creator info
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from("creator_payouts")
      .select(`
        *,
        creators:creator_id(
          handle,
          payout_email,
          user_id,
          profiles:user_id(email, display_name)
        )
      `)
      .eq("id", payout_id)
      .single();

    if (payoutError || !payout) {
      console.error("Payout not found:", payoutError);
      throw new Error("Payout not found");
    }

    console.log("Payout details:", payout);

    // Determine email recipient
    const creatorEmail = payout.creators?.payout_email || payout.creators?.profiles?.email;
    const creatorName = payout.creators?.profiles?.display_name || payout.creators?.handle || "Creator";

    if (!creatorEmail) {
      console.error("No email found for creator");
      throw new Error("Creator email not found");
    }

    // Build email content based on status
    const amount = Number(payout.amount).toFixed(2);
    const method = payout.payout_method.replace("_", " ");

    let subject: string;
    let htmlContent: string;

    if (status === "completed") {
      subject = `Your payout of $${amount} has been processed! 💸`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e; margin-bottom: 20px;">Payout Completed! ✅</h1>
          <p style="font-size: 16px; color: #333;">Hi ${creatorName},</p>
          <p style="font-size: 16px; color: #333;">Great news! Your payout request has been successfully processed.</p>
          
          <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #71717a; padding: 8px 0;">Amount:</td>
                <td style="text-align: right; font-weight: bold; font-size: 20px; color: #22c55e;">$${amount}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 8px 0;">Method:</td>
                <td style="text-align: right; text-transform: capitalize;">${method}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 8px 0;">Sent to:</td>
                <td style="text-align: right;">${payout.payout_details?.email || "Your registered account"}</td>
              </tr>
              ${notes ? `
              <tr>
                <td style="color: #71717a; padding: 8px 0;">Notes:</td>
                <td style="text-align: right;">${notes}</td>
              </tr>
              ` : ""}
            </table>
          </div>
          
          <p style="font-size: 14px; color: #71717a;">Please allow 1-3 business days for the funds to appear in your account.</p>
          <p style="font-size: 16px; color: #333; margin-top: 20px;">Thank you for being a creator on our platform! 🎶</p>
          
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
          <p style="font-size: 12px; color: #a1a1aa;">This is an automated message from Dump. Do not reply to this email.</p>
        </div>
      `;
    } else {
      subject = `Payout request update - Action may be required`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444; margin-bottom: 20px;">Payout Could Not Be Processed</h1>
          <p style="font-size: 16px; color: #333;">Hi ${creatorName},</p>
          <p style="font-size: 16px; color: #333;">Unfortunately, we were unable to process your payout request.</p>
          
          <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #fecaca;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #71717a; padding: 8px 0;">Amount:</td>
                <td style="text-align: right; font-weight: bold; font-size: 20px;">$${amount}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 8px 0;">Method:</td>
                <td style="text-align: right; text-transform: capitalize;">${method}</td>
              </tr>
              ${notes ? `
              <tr>
                <td style="color: #ef4444; padding: 8px 0;">Reason:</td>
                <td style="text-align: right; color: #ef4444;">${notes}</td>
              </tr>
              ` : ""}
            </table>
          </div>
          
          <p style="font-size: 16px; color: #333;">Your balance remains unchanged. Please verify your payout details in your settings and try again, or contact support if you need assistance.</p>
          
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
          <p style="font-size: 12px; color: #a1a1aa;">This is an automated message from Dump. Do not reply to this email.</p>
        </div>
      `;
    }

    // Send email
    console.log("Sending email to:", creatorEmail);
    const emailResponse = await sendEmail(creatorEmail, subject, htmlContent);

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in notify-payout function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
