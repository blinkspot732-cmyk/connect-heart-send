import { corsHeaders, json, sha256 } from "../_shared/cors.ts";
import { admin } from "../_shared/device.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Auth via device credentials (header or Basic)
    let deviceId = req.headers.get("x-device-id") ?? "";
    let deviceToken = req.headers.get("x-device-token") ?? "";

    if (!deviceId || !deviceToken) {
      const auth = req.headers.get("authorization") ?? "";
      if (auth.toLowerCase().startsWith("basic ")) {
        try {
          const decoded = atob(auth.slice(6).trim());
          const [u, p] = decoded.split(":");
          deviceId = u ?? "";
          deviceToken = p ?? "";
        } catch { /* ignore */ }
      }
    }
    if (!deviceId || !deviceToken) {
      return json({ success: false, error: "Missing X-Device-Id / X-Device-Token" }, 401);
    }

    const sb = admin();
    const { data: device } = await sb.from("devices").select("*").eq("device_id", deviceId).maybeSingle();
    if (!device) return json({ success: false, error: "Device not found" }, 404);
    const hash = await sha256(deviceToken);
    if (hash !== device.device_token_hash) return json({ success: false, error: "Invalid device token" }, 401);
    if (device.status !== "active") return json({ success: false, error: "Device inactive" }, 403);

    const body = await req.json().catch(() => ({}));
    const recipient: string = (body.recipient ?? body.to ?? "").toString().trim();
    const message: string = (body.message ?? body.text ?? "").toString();

    if (!/^\+?[1-9]\d{6,14}$/.test(recipient)) {
      return json({ success: false, error: "Invalid recipient. Use E.164 e.g. +254712345678" }, 400);
    }
    if (!message || message.length > 1600) {
      return json({ success: false, error: "Message must be 1-1600 chars" }, 400);
    }

    // Quota check
    const { data: quota, error: qerr } = await sb.rpc("check_and_increment_sms_quota", { _user_id: device.user_id });
    if (qerr) return json({ success: false, error: qerr.message }, 500);
    const q: any = quota;
    if (!q?.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: "Daily SMS quota exceeded. Upgrade your plan.",
        tier: q.tier, limit: q.limit, used: q.used, remaining: 0,
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(q.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Tier": q.tier,
        },
      });
    }

    const { data: msg, error } = await sb.from("messages").insert({
      user_id: device.user_id,
      device_id: device.id,
      direction: "outbound",
      recipient,
      message,
      status: "queued",
    }).select().single();
    if (error) return json({ success: false, error: error.message }, 400);

    return new Response(JSON.stringify({
      success: true,
      message_id: msg.id,
      status: "queued",
      tier: q.tier, limit: q.limit, remaining: q.remaining,
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(q.limit),
        "X-RateLimit-Remaining": String(q.remaining),
        "X-RateLimit-Tier": q.tier,
      },
    });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
});
