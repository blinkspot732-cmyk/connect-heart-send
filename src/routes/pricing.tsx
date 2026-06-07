import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { TIERS, detectGeo, convertKesTo, formatMoney } from "@/lib/pricing";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

function PricingPage() {
  const [currency, setCurrency] = useState("KES");
  const [local, setLocal] = useState<Record<string, number | null>>({});

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">SimGate</Link>
          <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Simple pricing for any volume</h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-4">
          Start free with 20 SMS / day. Upgrade as you grow — pay in your local currency, billed in KES.
        </p>
        <p className="text-xs text-muted-foreground mb-10">Showing prices in {currency}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {TIERS.map((t) => {
            const localPrice = local[t.id];
            return (
              <Card key={t.id} className={`p-6 flex flex-col ${t.popular ? "border-primary shadow-lg ring-1 ring-primary/30" : ""}`}>
                {t.popular && (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-primary mb-2">
                    <Sparkles className="size-3" /> Most popular
                  </div>
                )}
                <h3 className="text-xl font-semibold">{t.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-bold">KES {t.priceKes.toLocaleString()}</span>
                  {t.priceKes > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                </div>
                {currency !== "KES" && t.priceKes > 0 && localPrice != null && (
                  <div className="text-xs text-muted-foreground mb-2">≈ {formatMoney(localPrice, currency)}</div>
                )}
                <div className="text-sm font-medium text-primary my-3">{t.smsPerDay.toLocaleString()} SMS / day</div>
                <ul className="space-y-2 text-sm mb-6 flex-1">
                  {t.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="size-4 text-[color:var(--success)] mt-0.5 shrink-0" /> {h}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={t.popular ? "default" : "outline"}>
                  <Link to="/auth">
                    {t.priceKes === 0 ? "Start free" : "Get started"} <ArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          All plans include device pairing via QR, real-time webhooks, and a full developer API.
        </p>
      </section>
    </div>
  );
}
