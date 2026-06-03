import { corsHeaders, json } from "../_shared/cors.ts";
import { authDevice } from "../_shared/device.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const res = await authDevice(body);
    if (res.error) return res.error;
    const { sb, device } = res;
    if (!body.message_id) return json({ success: false, error: "Missing message_id" }, 400);
    await sb.from("messages").update({
      status: "failed",
      failed_at: new Date().toISOString(),
      failure_reason: body.reason ?? "unknown",
    }).eq("id", body.message_id).eq("device_id", device.id);
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
});
