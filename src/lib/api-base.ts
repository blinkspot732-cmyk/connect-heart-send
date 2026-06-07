// Public API base URL — proxies to Supabase Edge Functions via simresend.web.app
export const API_BASE = "https://simresend.web.app/v1";

// Fallback used by Android QR/manual pairing if the proxy is unreachable
export const SUPABASE_FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
