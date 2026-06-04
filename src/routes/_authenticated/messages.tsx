import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send } from "lucide-react";
import { timeAgo } from "@/lib/credentials";
import { recipientSchema, smsBodySchema, sanitizeText } from "@/lib/security";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/messages")({
  component: Messages,
});

function Messages() {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [text, setText] = useState("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500);
    setMsgs(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("devices").select("id, device_name, last_seen").then(({ data }) => setDevices(data ?? []));
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const sendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRec = recipientSchema.safeParse(recipient);
    if (!parsedRec.success) return toast.error(parsedRec.error.issues[0].message);
    const safe = sanitizeText(text, 1600);
    const parsedBody = smsBodySchema.safeParse(safe);
    if (!parsedBody.success) return toast.error(parsedBody.error.issues[0].message);
    if (!deviceId) return toast.error("Choose a device");

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return toast.error("Not signed in"); }
    const { error } = await supabase.from("messages").insert({
      user_id: user.id,
      device_id: deviceId,
      direction: "outbound",
      recipient: parsedRec.data,
      message: parsedBody.data,
      status: "queued",
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Queued — your device will send shortly");
    setOpen(false); setRecipient(""); setText("");
    load();
  };

  const filtered = msgs.filter((m) =>
    !q ||
    (m.recipient ?? "").includes(q) ||
    (m.sender ?? "").includes(q) ||
    (m.message ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground text-sm">All outbound and inbound SMS.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Send className="size-4 mr-2" />Send test SMS</Button>
      </div>
      <Card className="p-3 sm:p-4 overflow-x-auto">
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
                <TableCell className="max-w-[200px] sm:max-w-md truncate">{m.message}</TableCell>
                <TableCell><Badge status={m.status} /></TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{timeAgo(m.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send test SMS</DialogTitle></DialogHeader>
          <form onSubmit={sendTest} className="space-y-4">
            <div>
              <Label>Device</Label>
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger><SelectValue placeholder="Pick a device" /></SelectTrigger>
                <SelectContent>
                  {devices.length === 0 && <SelectItem value="none" disabled>No devices — add one first</SelectItem>}
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.device_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipient</Label>
              <Input placeholder="+233501234567" value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={4} maxLength={1600} value={text} onChange={(e) => setText(e.target.value)} required />
              <p className="text-xs text-muted-foreground mt-1">{text.length} / 1600</p>
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              <Send className="size-4 mr-2" />{sending ? "Queueing…" : "Send"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
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
