import { corsHeaders, json } from "../_shared/cors.ts";
import { authDevice } from "../_shared/device.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const res = await authDevice(body);
    if (res.error) return res.error;
    const { sb, device } = res;
    // Pick up to 10 queued messages for this device, mark as picked
    const { data: queued } = await sb
      .from("messages")
      .select("*")
      .eq("device_id", device.id)
      .eq("status", "queued")
      .order("queued_at", { ascending: true })
      .limit(10);
    const jobs = (queued ?? []).map((m) => ({
      job_id: m.id,
      type: "send_sms",
      recipient: m.recipient,
      message: m.message,
    }));
    if (queued && queued.length) {
      const ids = queued.map((m) => m.id);
      await sb.from("messages").update({
        status: "picked",
        picked_at: new Date().toISOString(),
      }).in("id", ids);
    }
    return json({ jobs });
  } catch (e) {
    return json({ jobs: [], error: String(e) }, 500);
  }
});
