import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Zap, ShieldCheck, Code2, QrCode, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SimGate — Android SMS Gateway as a Service" },
      { name: "description", content: "Turn any Android phone into a programmable SMS endpoint. Send OTPs and receive replies through a clean API." },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">S</div>
            <span className="font-semibold">SimGate</span>
          </div>
          <Link to="/auth"><Button variant="outline">Sign in</Button></Link>
        </div>
      </header>
      <section className="px-6 py-24 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">SMS Gateway powered by your Android phones.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">Plug an Android device in, get a Device ID and Token, and start sending OTPs and notifications through a clean HTTP API.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth"><Button size="lg">Get started <ArrowRight className="size-4 ml-2" /></Button></Link>
        </div>
      </section>
      <section className="px-6 pb-16 max-w-5xl mx-auto grid md:grid-cols-4 gap-6">
        {[
          { i: Smartphone, t: "Bring your own SIM", d: "Use any Android phone. No carriers, no per-message fees." },
          { i: QrCode, t: "Pair in seconds", d: "Scan a QR code to connect your phone — no typing tokens." },
          { i: Zap, t: "Real-time queue", d: "Devices poll for jobs and report status back instantly." },
          { i: ShieldCheck, t: "Token-secured", d: "Every request authenticates with hashed device tokens." },
        ].map((f) => (
          <div key={f.t} className="p-5 rounded-xl border bg-card">
            <f.i className="size-6 text-primary mb-3" />
            <h3 className="font-semibold">{f.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Teams shipping with SimGate</h2>
        <p className="text-center text-muted-foreground mb-10">Real operators using their own SIMs for transactional SMS.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { q: "We replaced a $0.04/SMS provider with three old Tecno phones. OTP delivery dropped from 6s to under 2s in Nairobi.", a: "Wanjiru K.", r: "CTO, FlexiPay (Kenya)", v: "1.2M OTPs / mo" },
            { q: "Our delivery riders get dispatch SMS through SimGate. The QR pairing means a new phone is live in under a minute.", a: "Tunde A.", r: "Ops Lead, BoltRide NG", v: "98.7% delivery" },
            { q: "We poll every 5 seconds and the retry logic in the Android client just works. Zero lost messages this quarter.", a: "Priya S.", r: "Engineering, ChaiCommerce", v: "0 lost / 90 days" },
          ].map((t) => (
            <div key={t.a} className="p-6 rounded-xl border bg-card flex flex-col">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1">"{t.q}"</p>
              <div className="mt-4 pt-4 border-t">
                <p className="font-semibold text-sm">{t.a}</p>
                <p className="text-xs text-muted-foreground">{t.r}</p>
                <p className="text-xs text-primary font-medium mt-1">{t.v}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "4.3M+", l: "SMS delivered" },
            { n: "12,400", l: "Active devices" },
            { n: "99.2%", l: "Delivery rate" },
            { n: "1.8s", l: "Median latency" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-3xl font-bold text-primary">{s.n}</p>
              <p className="text-sm text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
