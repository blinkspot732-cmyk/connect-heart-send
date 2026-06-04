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
      <section className="px-6 pb-24 max-w-5xl mx-auto grid md:grid-cols-4 gap-6">
        {[
          { i: Smartphone, t: "Bring your own SIM", d: "Use any Android phone. No carriers, no per-message fees." },
          { i: Zap, t: "Real-time queue", d: "Devices poll for jobs and report status back instantly." },
          { i: ShieldCheck, t: "Token-secured", d: "Every request authenticates with hashed device tokens." },
          { i: Code2, t: "Simple API", d: "POST a JSON body. Get a message ID. Done." },
        ].map((f) => (
          <div key={f.t} className="p-5 rounded-xl border bg-card">
            <f.i className="size-6 text-primary mb-3" />
            <h3 className="font-semibold">{f.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
