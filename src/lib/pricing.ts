export type Tier = "free" | "starter" | "pro" | "business";

export interface TierPlan {
  id: Tier;
  name: string;
  priceKes: number;
  smsPerDay: number;
  highlights: string[];
  popular?: boolean;
}

export const TIERS: TierPlan[] = [
  {
    id: "free",
    name: "Free",
    priceKes: 0,
    smsPerDay: 20,
    highlights: ["20 SMS / day", "1 device", "Community support", "Webhooks"],
  },
  {
    id: "starter",
    name: "Starter",
    priceKes: 100,
    smsPerDay: 200,
    highlights: ["200 SMS / day", "3 devices", "Email support", "Webhooks + retries"],
  },
  {
    id: "pro",
    name: "Pro",
    priceKes: 500,
    smsPerDay: 1500,
    highlights: ["1,500 SMS / day", "10 devices", "Priority support", "Custom rate limits"],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    priceKes: 1000,
    smsPerDay: 5000,
    highlights: ["5,000 SMS / day", "Unlimited devices", "24/7 support", "SLA + analytics"],
  },
];

// Local currency conversion helpers --------------------------------------
export interface GeoInfo {
  country?: string;
  currency?: string;
}

let _geoCache: GeoInfo | null = null;
export async function detectGeo(): Promise<GeoInfo> {
  if (_geoCache) return _geoCache;
  try {
    const r = await fetch("https://ipapi.co/json/").then((x) => x.json());
    _geoCache = { country: r.country_code, currency: r.currency };
    return _geoCache;
  } catch {
    _geoCache = {};
    return _geoCache;
  }
}

const _ratesCache: Record<string, { ts: number; rate: number }> = {};
export async function convertKesTo(amountKes: number, target: string): Promise<number | null> {
  if (!target || target === "KES") return amountKes;
  const key = target.toUpperCase();
  const now = Date.now();
  const cached = _ratesCache[key];
  if (cached && now - cached.ts < 30 * 60_000) return Math.round(amountKes * cached.rate * 100) / 100;
  try {
    const r = await fetch(`https://api.exchangerate.host/latest?base=KES&symbols=${key}`).then((x) => x.json());
    const rate = r?.rates?.[key];
    if (!rate) return null;
    _ratesCache[key] = { ts: now, rate };
    return Math.round(amountKes * rate * 100) / 100;
  } catch {
    return null;
  }
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
