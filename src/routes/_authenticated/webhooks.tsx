import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Copy, Webhook as WebhookIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/webhooks")({
  component: Webhooks,
});

function genSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return "whsec_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function Webhooks() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState({ sent: true, delivered: true, failed: true });

  const load = async () => {
    const [{ data: e }, { data: d }] = await Promise.all([
      supabase.from("webhook_endpoints" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("webhook_deliveries" as any).select("*").order("created_at", { ascending: false }).limit(25),
    ]);
    setEndpoints(e ?? []);
    setDeliveries(d ?? []);
  };
  useEffect(() => { load(); const id = setInterval(load, 8000); return () => clearInterval(id); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try { new URL(url); } catch { toast.error("Invalid URL"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const eventList = [
      events.sent ? "sms.sent" : null,
      events.delivered ? "sms.delivered" : null,
      events.failed ? "sms.failed" : null,
    ].filter(Boolean) as string[];
    if (!eventList.length) { toast.error("Pick at least one event"); return; }
    const { error } = await supabase.from("webhook_endpoints" as any).insert({
      user_id: user.id, url, secret: genSecret(), events: eventList, active: true,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setUrl("");
    load();
    toast.success("Webhook added");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    await supabase.from("webhook_endpoints" as any).delete().eq("id", id);
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("webhook_endpoints" as any).update({ active: !active }).eq("id", id);
    load();
  };

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-3">
            <WebhookIcon className="size-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          </div>
          <p className="text-muted-foreground mt-1">Receive POST callbacks for SMS sent, delivered, and failed events.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-2" />Add endpoint</Button>
      </div>

      {endpoints.length === 0 ? (
        <Card className="p-12 text-center mt-6">
          <WebhookIcon className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No endpoints yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add a URL to start receiving event callbacks.</p>
          <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-2" />Add endpoint</Button>
        </Card>
      ) : (
        <div className="grid gap-4 mt-6">
          {endpoints.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`size-2 rounded-full ${e.active ? "bg-[color:var(--success)]" : "bg-muted-foreground"}`} />
                    <code className="text-sm truncate">{e.url}</code>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {e.events.map((ev: string) => (
                      <span key={ev} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{ev}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{e.secret}</code>
                    <button onClick={() => copy(e.secret)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                      <Copy className="size-3" /> copy secret
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggle(e.id, e.active)}>{e.active ? "Pause" : "Resume"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mt-10 mb-3">Recent deliveries</h2>
      {deliveries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deliveries yet.</p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr>
                <th className="p-3">Event</th><th>Status</th><th>Attempts</th><th>Code</th><th>When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td className="p-3 font-mono text-xs">{d.event}</td>
                  <td className="p-3">
                    {d.status === "delivered" && <span className="inline-flex items-center gap-1 text-[color:var(--success)]"><CheckCircle2 className="size-3.5" />Delivered</span>}
                    {d.status === "failed" && <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="size-3.5" />Failed</span>}
                    {d.status === "pending" && <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="size-3.5" />Pending</span>}
                  </td>
                  <td className="p-3">{d.attempts}</td>
                  <td className="p-3">{d.last_response_code ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add webhook endpoint</DialogTitle></DialogHeader>
          <form onSubmit={add} className="space-y-4">
            <div>
              <Label>Endpoint URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-app.com/webhooks/sms" required />
            </div>
            <div>
              <Label>Events</Label>
              <div className="space-y-2 mt-2">
                {[
                  { k: "sent", label: "sms.sent" },
                  { k: "delivered", label: "sms.delivered" },
                  { k: "failed", label: "sms.failed" },
                ].map(({ k, label }) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox"
                      checked={(events as any)[k]}
                      onChange={(e) => setEvents({ ...events, [k]: e.target.checked })} />
                    <code className="font-mono">{label}</code>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter><Button type="submit">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
