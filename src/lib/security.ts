import { z } from "zod";

// Common disposable email domains (curated list)
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com",
  "throwawaymail.com", "yopmail.com", "trashmail.com", "getairmail.com",
  "fakeinbox.com", "sharklasers.com", "maildrop.cc", "dispostable.com",
  "mintemail.com", "mohmal.com", "tempr.email", "tempmailaddress.com",
  "temp-mail.org", "temp-mail.io", "moakt.com", "emailondeck.com",
  "fakemail.net", "mailnesia.com", "spambox.us", "spam4.me", "tmpmail.net",
  "tmpmail.org", "trbvm.com", "mytemp.email", "mailcatch.com", "anonbox.net",
  "deadaddress.com", "discard.email", "harakirimail.com", "incognitomail.com",
  "jetable.org", "mailexpire.com", "no-spam.ws", "spamgourmet.com",
]);

export const isDisposableEmail = (email: string): boolean => {
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return true;
  return DISPOSABLE_DOMAINS.has(domain);
};

// Sanitize free-text input: strip control chars, dangerous HTML, null bytes
export const sanitizeText = (input: string, maxLen = 1000): string => {
  if (typeof input !== "string") return "";
  return input
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, maxLen);
};

// Strict phone: E.164-ish digits
export const phoneSchema = z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone (use international format)");

export const passwordSchema = z
  .string()
  .min(8, "Min 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Need an uppercase letter")
  .regex(/[a-z]/, "Need a lowercase letter")
  .regex(/[0-9]/, "Need a number");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email")
  .max(254)
  .refine((v) => !isDisposableEmail(v), "Disposable email addresses are not allowed");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name required")
  .max(80, "Name too long")
  .regex(/^[\p{L} '\-.]+$/u, "Name has invalid characters");

export const smsBodySchema = z.string().trim().min(1, "Message required").max(1600, "Message too long");

export const recipientSchema = z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, "Invalid recipient number");

// Browser fingerprint cached per-session
let _fpPromise: Promise<string> | null = null;
export const getDeviceFingerprint = async (): Promise<string> => {
  if (_fpPromise) return _fpPromise;
  _fpPromise = (async () => {
    try {
      const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
      const agent = await FingerprintJS.load();
      const r = await agent.get();
      return r.visitorId;
    } catch {
      return "fp_" + Math.random().toString(36).slice(2);
    }
  })();
  return _fpPromise;
};
