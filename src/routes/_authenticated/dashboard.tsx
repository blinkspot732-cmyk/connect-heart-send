import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Smartphone, MessageSquare, KeyRound, Activity } from "lucide-react";
import { isOnline } from "@/lib/credentials";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({ devices: 0, online: 0, sent: 0, queued: 0, failed: 0, keys: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: devs }, { data: msgs }, { data: keys }] = await Promise.all([
        supabase.from("devices").select("*"),
        supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("api_keys").select("id"),
      ]);
      const d = devs ?? []; const m = msgs ?? [];
      setStats({
        devices: d.length,
        online: d.filter((x) => isOnline(x.last_seen)).length,
        sent: m.filter((x) => x.status === "sent" || x.status === "delivered").length,
        queued: m.filter((x) => x.status === "queued" || x.status === "picked").length,
        failed: m.filter((x) => x.status === "failed").length,
        keys: keys?.length ?? 0,
      });
      setRecent(m.slice(0, 8));
    })();
  }, []);

  const cards = [
    { label: "Devices online", value: `${stats.online}/${stats.devices}`, icon: Smartphone, color: "text-primary" },
    { label: "Messages sent", value: stats.sent, icon: MessageSquare, color: "text-[color:var(--success)]" },
    { label: "Queued", value: stats.queued, icon: Activity, color: "text-[color:var(--warning)]" },
    { label: "API keys", value: stats.keys, icon: KeyRound, color: "text-accent-foreground" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your SMS gateway.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`size-5 ${c.color}`} />
            </div>
            <div className="text-3xl font-semibold">{c.value}</div>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent messages</h2>
          <Link to="/messages" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No messages yet. Add a device and start sending.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
                <div className="truncate flex-1">
                  <span className="font-medium">{m.direction === "inbound" ? m.sender : m.recipient}</span>
                  <span className="text-muted-foreground ml-2 truncate">{m.message}</span>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    delivered: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    queued: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    picked: "bg-accent text-accent-foreground",
    failed: "bg-destructive/15 text-destructive",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
