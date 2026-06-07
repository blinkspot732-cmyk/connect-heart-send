import { corsHeaders, json } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference") ?? (await req.json().catch(() => ({}))).reference;
    if (!reference) return json({ error: "Missing reference" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: payment } = await admin.from("payments").select("*").eq("reference", reference).maybeSingle();
    if (!payment) return json({ error: "Payment not found" }, 404);

    // Already resolved
    if (payment.status !== "pending") {
      return json({ status: payment.status, tier: payment.tier, reference, expires_at: payment.expires_at });
    }

    // Expired by clock
    if (new Date(payment.expires_at).getTime() < Date.now()) {
      await admin.from("payments").update({ status: "expired" }).eq("id", payment.id);
      return json({ status: "expired", reference });
    }

    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}` },
    });
    const ps = await psRes.json();
    if (!ps.status) return json({ status: "pending", reference });

    const psStatus = ps.data?.status;
    if (psStatus === "success") {
      await admin.from("payments").update({
        status: "paid", paid_at: new Date().toISOString(), raw_payload: ps.data,
      }).eq("id", payment.id);

      const periodEnd = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
      await admin.from("subscriptions").upsert({
        user_id: payment.user_id,
        tier: payment.tier,
        status: "active",
        current_period_end: periodEnd,
        paystack_reference: reference,
      }, { onConflict: "user_id" });

      return json({ status: "paid", tier: payment.tier, reference, current_period_end: periodEnd });
    }
    if (psStatus === "failed" || psStatus === "abandoned") {
      await admin.from("payments").update({ status: "failed", raw_payload: ps.data }).eq("id", payment.id);
      return json({ status: "failed", reference });
    }
    return json({ status: "pending", reference, expires_at: payment.expires_at });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
