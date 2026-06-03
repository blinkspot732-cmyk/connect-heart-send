import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: Analytics,
});

function Analytics() {
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ sent: 0, failed: 0, inbound: 0 });

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 86400_000).toISOString();
      const { data: msgs } = await supabase.from("messages").select("*").gte("created_at", since);
      const buckets: Record<string, { day: string; sent: number; failed: number; inbound: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000).toISOString().slice(5, 10);
        buckets[d] = { day: d, sent: 0, failed: 0, inbound: 0 };
      }
      let s = 0, f = 0, ib = 0;
      (msgs ?? []).forEach((m) => {
        const k = m.created_at.slice(5, 10);
        if (!buckets[k]) return;
        if (m.direction === "inbound") { buckets[k].inbound++; ib++; }
        else if (m.status === "sent" || m.status === "delivered") { buckets[k].sent++; s++; }
        else if (m.status === "failed") { buckets[k].failed++; f++; }
      });
      setData(Object.values(buckets));
      setTotals({ sent: s, failed: f, inbound: ib });
    })();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
      <p className="text-muted-foreground mb-8">Last 7 days.</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><p className="text-sm text-muted-foreground">Sent</p><p className="text-2xl font-semibold">{totals.sent}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Failed</p><p className="text-2xl font-semibold">{totals.failed}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">Inbound</p><p className="text-2xl font-semibold">{totals.inbound}</p></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Daily volume</h2>
        <ChartContainer config={{ sent: { label: "Sent", color: "hsl(var(--chart-2))" }, failed: { label: "Failed", color: "hsl(var(--chart-4))" }, inbound: { label: "Inbound", color: "hsl(var(--chart-1))" } }} className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sent" fill="var(--chart-2)" radius={4} />
              <Bar dataKey="failed" fill="var(--chart-4)" radius={4} />
              <Bar dataKey="inbound" fill="var(--chart-1)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>
    </div>
  );
}
