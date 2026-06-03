import { corsHeaders, json } from "../_shared/cors.ts";
import { authDevice } from "../_shared/device.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const res = await authDevice(body);
    if (res.error) return res.error;
    const { sb, device } = res;
    await sb.from("devices").update({
      last_seen: new Date().toISOString(),
      battery_level: body.battery ?? device.battery_level,
      signal_strength: body.signal ?? device.signal_strength,
    }).eq("id", device.id);
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
});
