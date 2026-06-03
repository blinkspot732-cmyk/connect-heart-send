import { corsHeaders, json, sha256 } from "../_shared/cors.ts";
import { admin } from "../_shared/device.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ success: false, error: "Missing API key" }, 401);

    const sb = admin();
    const hash = await sha256(token);
    const { data: key } = await sb
      .from("api_keys")
      .select("*")
      .eq("api_key_hash", hash)
      .eq("active", true)
      .maybeSingle();
    if (!key) return json({ success: false, error: "Invalid API key" }, 401);

    const body = await req.json();
    if (!body.device_id || !body.recipient || !body.message) {
      return json({ success: false, error: "Missing device_id, recipient or message" }, 400);
    }

    const { data: device } = await sb
      .from("devices")
      .select("*")
      .eq("device_id", body.device_id)
      .eq("user_id", key.user_id)
      .maybeSingle();
    if (!device) return json({ success: false, error: "Device not found" }, 404);

    const { data: msg, error } = await sb.from("messages").insert({
      user_id: key.user_id,
      device_id: device.id,
      direction: "outbound",
      recipient: body.recipient,
      message: body.message,
      status: "queued",
    }).select().single();
    if (error) return json({ success: false, error: error.message }, 400);

    await sb.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);

    return json({ success: true, message_id: msg.id, status: "queued" });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
});
