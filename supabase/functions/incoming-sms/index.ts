import { corsHeaders, json } from "../_shared/cors.ts";
import { authDevice } from "../_shared/device.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const res = await authDevice(body);
    if (res.error) return res.error;
    const { sb, device } = res;
    if (!body.sender || !body.message) return json({ success: false, error: "Missing sender/message" }, 400);
    const { error } = await sb.from("messages").insert({
      user_id: device.user_id,
      device_id: device.id,
      direction: "inbound",
      sender: body.sender,
      message: body.message,
      status: "delivered",
      delivered_at: new Date().toISOString(),
    });
    if (error) return json({ success: false, error: error.message }, 400);
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
});
