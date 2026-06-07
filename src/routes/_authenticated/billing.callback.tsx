import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/billing/callback")({
  component: BillingCallbackPage,
  validateSearch: (s: Record<string, unknown>) => ({ reference: (s.reference as string) ?? (s.trxref as string) ?? "" }),
});

function BillingCallbackPage() {
  const { reference } = Route.useSearch();
  const [status, setStatus] = useState<"pending" | "paid" | "failed" | "expired" | "error">("pending");
  const [info, setInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!reference) { setStatus("error"); return; }
    let stopped = false;
    let interval: any;

    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
        if (error) throw error;
        if (stopped) return;
        setInfo(data);
        if (data.status === "paid" || data.status === "failed" || data.status === "expired") {
          setStatus(data.status);
          clearInterval(interval);
        }
        if (data.expires_at) {
          const ms = new Date(data.expires_at).getTime() - Date.now();
          setCountdown(Math.max(0, Math.floor(ms / 1000)));
        }
      } catch {
        if (!stopped) setStatus("error");
      }
    };

    poll();
    interval = setInterval(poll, 4000);
    return () => { stopped = true; clearInterval(interval); };
  }, [reference]);

  useEffect(() => {
    if (countdown == null) return;
    const t = setInterval(() => setCountdown((c) => (c == null ? null : Math.max(0, c - 1))), 1000);
    return () => clearInterval(t);
  }, [countdown !== null]);

  return (
    <div className="p-6 md:p-10 max-w-xl mx-auto">
      <Card className="p-8 text-center">
        {status === "pending" && (
          <>
            <Loader2 className="size-12 mx-auto text-primary animate-spin mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Verifying payment…</h1>
            <p className="text-muted-foreground mb-2">We're checking with Paystack. This usually takes a few seconds.</p>
            {countdown != null && (
              <p className="text-xs text-muted-foreground">
                Expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
              </p>
            )}
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle2 className="size-12 mx-auto text-[color:var(--success)] mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Payment successful</h1>
            <p className="text-muted-foreground mb-6">
              Welcome to the <strong className="capitalize">{info?.tier}</strong> plan. Your new quota is active immediately.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild><Link to="/dashboard">Go to Dashboard</Link></Button>
              <Button asChild variant="outline"><Link to="/billing">View plan</Link></Button>
            </div>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="size-12 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Payment failed</h1>
            <p className="text-muted-foreground mb-6">No charge was made. You can try again from the billing page.</p>
            <Button asChild><Link to="/billing">Back to Billing</Link></Button>
          </>
        )}
        {status === "expired" && (
          <>
            <Clock className="size-12 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Payment expired</h1>
            <p className="text-muted-foreground mb-6">This checkout link expired after 30 minutes. Start a new one to upgrade.</p>
            <Button asChild><Link to="/billing">Try again</Link></Button>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="size-12 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">We couldn't verify this payment. If you were charged, contact support with reference <code>{reference}</code>.</p>
            <Button asChild><Link to="/billing">Back to Billing</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
}
