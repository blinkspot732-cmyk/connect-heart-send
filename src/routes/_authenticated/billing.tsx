import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, CreditCard, Sparkles } from "lucide-react";
import { TIERS, type Tier, detectGeo, convertKesTo, formatMoney } from "@/lib/pricing";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingPage,
});

function BillingPage() {
  const nav = useNavigate();
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [currency, setCurrency] = useState("KES");
  const [local, setLocal] = useState<Record<string, number | null>>({});
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: s }, { data: u }] = await Promise.all([
        supabase.from("subscriptions" as any).select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("usage_daily" as any).select("sent_count").eq("user_id", user.id).eq("day", today).maybeSingle(),
      ]);
      setSub(s);
      const tier = (s as any)?.tier ?? "free";
      const limit = TIERS.find((t) => t.id === tier)?.smsPerDay ?? 20;
      setUsage({ used: (u as any)?.sent_count ?? 0, limit });
    })();

    (async () => {
      const geo = await detectGeo();
      const cur = geo.currency || "KES";
      setCurrency(cur);
      const map: Record<string, number | null> = {};
      await Promise.all(TIERS.map(async (t) => {
        map[t.id] = t.priceKes === 0 ? 0 : await convertKesTo(t.priceKes, cur);
      }));
      setLocal(map);
    })();
  }, []);

  const upgrade = async (tier: Tier) => {
    setLoadingTier(tier);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-init", {
        body: { tier, display_currency: currency, display_amount: local[tier] },
      });
      if (error) throw error;
      if (!data?.authorization_url) throw new Error("No checkout URL");
      window.location.href = data.authorization_url;
    } catch (e: any) {
      toast.error(e.message ?? "Could not start payment");
      setLoadingTier(null);
    }
  };

  const currentTier = (sub?.tier ?? "free") as Tier;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <CreditCard className="size-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Prices shown in your local currency ({currency}). Payments processed by Paystack in KES.
      </p>

      {usage && (
        <Card className="p-5 mb-8 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Current plan</div>
              <div className="text-xl font-semibold capitalize">{currentTier}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Today's usage</div>
              <div className="text-xl font-semibold">{usage.used} / {usage.limit} SMS</div>
            </div>
            <div className="w-full">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((t) => {
          const isCurrent = t.id === currentTier;
          const localPrice = local[t.id];
          return (
            <Card key={t.id} className={`p-6 flex flex-col ${t.popular ? "border-primary shadow-lg" : ""}`}>
              {t.popular && (
                <div className="inline-flex items-center gap-1 text-xs font-medium text-primary mb-2">
                  <Sparkles className="size-3" /> Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold">KES {t.priceKes.toLocaleString()}</span>
                {t.priceKes > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
              </div>
              {currency !== "KES" && t.priceKes > 0 && localPrice != null && (
                <div className="text-xs text-muted-foreground mb-3">≈ {formatMoney(localPrice, currency)}</div>
              )}
              <div className="text-sm font-medium text-primary mb-3">{t.smsPerDay.toLocaleString()} SMS / day</div>
              <ul className="space-y-2 text-sm mb-6 flex-1">
                {t.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="size-4 text-[color:var(--success)] mt-0.5 shrink-0" /> {h}
                  </li>
                ))}
              </ul>
              <Button
                disabled={isCurrent || t.id === "free" || loadingTier !== null}
                onClick={() => upgrade(t.id)}
                className="w-full"
                variant={t.popular ? "default" : "outline"}
              >
                {loadingTier === t.id && <Loader2 className="size-4 mr-2 animate-spin" />}
                {isCurrent ? "Current plan" : t.id === "free" ? "Free forever" : "Upgrade"}
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Subscriptions renew monthly. Cancel anytime from this page.
      </p>
    </div>
  );
}
