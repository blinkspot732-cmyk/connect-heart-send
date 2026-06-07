import { corsHeaders, json } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const raw = await req.text();
    const sig = req.headers.get("x-paystack-signature") ?? "";
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const expected = createHmac("sha512", secret).update(raw).digest("hex");
    if (sig !== expected) return new Response("Invalid signature", { status: 401 });

    const event = JSON.parse(raw);
    if (event.event !== "charge.success") return new Response("ignored", { status: 200 });

    const reference = event.data.reference;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: payment } = await admin.from("payments").select("*").eq("reference", reference).maybeSingle();
    if (!payment || payment.status === "paid") return new Response("ok", { status: 200 });

    await admin.from("payments").update({
      status: "paid", paid_at: new Date().toISOString(), raw_payload: event.data,
    }).eq("id", payment.id);

    const periodEnd = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    await admin.from("subscriptions").upsert({
      user_id: payment.user_id,
      tier: payment.tier,
      status: "active",
      current_period_end: periodEnd,
      paystack_reference: reference,
    }, { onConflict: "user_id" });

    return new Response("ok", { status: 200 });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
