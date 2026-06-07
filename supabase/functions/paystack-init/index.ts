import { corsHeaders, json } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TIER_PRICES: Record<string, number> = { starter: 100, pro: 500, business: 1000 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Missing auth" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const tier: string = body.tier;
    if (!(tier in TIER_PRICES)) return json({ error: "Invalid tier" }, 400);
    const amountKes = TIER_PRICES[tier];
    const reference = `simgate_${tier}_${user.id.slice(0, 8)}_${Date.now()}`;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountKes * 100, // kobo / cents
        currency: "KES",
        reference,
        callback_url: "https://simresend.web.app/billing/callback",
        metadata: { user_id: user.id, tier },
      }),
    });
    const psJson = await psRes.json();
    if (!psJson.status) return json({ error: psJson.message ?? "Paystack init failed" }, 502);

    await admin.from("payments").insert({
      user_id: user.id,
      tier,
      amount_kes: amountKes,
      display_currency: body.display_currency ?? "KES",
      display_amount: body.display_amount ?? amountKes,
      reference,
      authorization_url: psJson.data.authorization_url,
      status: "pending",
    });

    return json({
      success: true,
      reference,
      authorization_url: psJson.data.authorization_url,
      access_code: psJson.data.access_code,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
