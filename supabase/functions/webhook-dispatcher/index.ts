import { corsHeaders, json } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const MAX_ATTEMPTS = 4;
const BACKOFF = [60, 300, 1800, 7200]; // seconds

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: queue } = await sb.from("webhook_deliveries")
      .select("*, webhook_endpoints(url, secret, active)")
      .eq("status", "pending")
      .lte("next_attempt_at", new Date().toISOString())
      .limit(50);

    let processed = 0;
    for (const item of queue ?? []) {
      const ep: any = (item as any).webhook_endpoints;
      if (!ep || !ep.active) {
        await sb.from("webhook_deliveries").update({ status: "failed", last_error: "endpoint inactive" }).eq("id", (item as any).id);
        continue;
      }
      const body = JSON.stringify((item as any).payload);
      const sig = createHmac("sha256", ep.secret).update(body).digest("hex");
      const attempts = ((item as any).attempts ?? 0) + 1;
      try {
        const r = await fetch(ep.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": `sha256=${sig}`,
            "X-Webhook-Event": (item as any).event,
            "X-Webhook-Delivery": (item as any).id,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        if (r.ok) {
          await sb.from("webhook_deliveries").update({
            status: "delivered", attempts, last_response_code: r.status,
          }).eq("id", (item as any).id);
        } else if (attempts >= MAX_ATTEMPTS) {
          await sb.from("webhook_deliveries").update({
            status: "failed", attempts, last_response_code: r.status, last_error: `HTTP ${r.status}`,
          }).eq("id", (item as any).id);
        } else {
          const next = new Date(Date.now() + BACKOFF[attempts - 1] * 1000).toISOString();
          await sb.from("webhook_deliveries").update({
            attempts, next_attempt_at: next, last_response_code: r.status, last_error: `HTTP ${r.status}`,
          }).eq("id", (item as any).id);
        }
      } catch (e) {
        if (attempts >= MAX_ATTEMPTS) {
          await sb.from("webhook_deliveries").update({
            status: "failed", attempts, last_error: String(e),
          }).eq("id", (item as any).id);
        } else {
          const next = new Date(Date.now() + BACKOFF[attempts - 1] * 1000).toISOString();
          await sb.from("webhook_deliveries").update({
            attempts, next_attempt_at: next, last_error: String(e),
          }).eq("id", (item as any).id);
        }
      }
      processed++;
    }
    return json({ processed });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
