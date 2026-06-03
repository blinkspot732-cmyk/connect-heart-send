// Generate a device id like dev_xxxxxxxxxx
export function generateDeviceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "dev_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate a device token like dtk_xxxxxxxxxxxxxxxxxxxxx (random)
export function generateDeviceToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return "dtk_" + base62(bytes);
}

// Generate API key sk_live_xxxx
export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return "sk_live_" + base62(bytes);
}

function base62(bytes: Uint8Array): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (const b of bytes) out += alphabet[b % 62];
  return out;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 90_000;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
