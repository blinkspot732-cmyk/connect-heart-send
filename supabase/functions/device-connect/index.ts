import { corsHeaders, json } from "../_shared/cors.ts";
import { authDevice } from "../_shared/device.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const res = await authDevice(body);
    if (res.error) return res.error;
    return json({ success: true, heartbeat_interval: 60, poll_interval: 5 });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
});
