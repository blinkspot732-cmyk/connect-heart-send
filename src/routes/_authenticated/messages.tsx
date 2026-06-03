import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/credentials";

export const Route = createFileRoute("/_authenticated/messages")({
  component: Messages,
});

function Messages() {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500);
      setMsgs(data ?? []);
    };
    load(); const id = setInterval(load, 5000); return () => clearInterval(id);
  }, []);
  const filtered = msgs.filter((m) => !q || (m.recipient ?? "").includes(q) || (m.sender ?? "").includes(q) || m.message.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">All outbound and inbound SMS.</p>
      </div>
      <Card className="p-4">
        <Input placeholder="Search recipient, sender or content..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-4" />
        <Table>
          <TableHeader><TableRow>
            <TableHead>Direction</TableHead><TableHead>To / From</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No messages</TableCell></TableRow>}
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="capitalize">{m.direction}</TableCell>
                <TableCell className="font-mono text-xs">{m.direction === "inbound" ? m.sender : m.recipient}</TableCell>
                <TableCell className="max-w-md truncate">{m.message}</TableCell>
                <TableCell><Badge status={m.status} /></TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{timeAgo(m.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    delivered: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    queued: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    picked: "bg-accent text-accent-foreground",
    failed: "bg-destructive/15 text-destructive",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
