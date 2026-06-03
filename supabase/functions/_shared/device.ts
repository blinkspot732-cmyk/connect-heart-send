import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sha256, json } from "./cors.ts";

export function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

export async function authDevice(body: { device_id?: string; device_token?: string }) {
  const sb = admin();
  if (!body.device_id || !body.device_token) {
    return { error: json({ success: false, error: "Missing device_id or device_token" }, 400) };
  }
  const { data: device, error } = await sb
    .from("devices")
    .select("*")
    .eq("device_id", body.device_id)
    .maybeSingle();
  if (error || !device) {
    return { error: json({ success: false, error: "Device not found" }, 404) };
  }
  const hash = await sha256(body.device_token);
  if (hash !== device.device_token_hash) {
    return { error: json({ success: false, error: "Invalid token" }, 401) };
  }
  if (device.status !== "active") {
    return { error: json({ success: false, error: "Device inactive" }, 403) };
  }
  await sb.from("devices").update({ last_seen: new Date().toISOString() }).eq("id", device.id);
  return { sb, device };
}
