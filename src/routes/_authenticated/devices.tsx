import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Copy, Smartphone, Trash2 } from "lucide-react";
import { generateDeviceId, generateDeviceToken, sha256Hex, isOnline, timeAgo } from "@/lib/credentials";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/devices")({
  component: DevicesPage,
});

function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [showCreds, setShowCreds] = useState<{ deviceId: string; token: string } | null>(null);
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");

  const load = async () => {
    const { data } = await supabase.from("devices").select("*").order("created_at", { ascending: false });
    setDevices(data ?? []);
  };
  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);

  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const deviceId = generateDeviceId();
    const token = generateDeviceToken();
    const hash = await sha256Hex(token);
    const { error } = await supabase.from("devices").insert({
      user_id: user.id,
      device_id: deviceId,
      device_token_hash: hash,
      device_name: name || "My Phone",
      model: model || null,
      manufacturer: manufacturer || null,
      status: "active",
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setName(""); setModel(""); setManufacturer("");
    setShowCreds({ deviceId, token });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this device?")) return;
    await supabase.from("devices").delete().eq("id", id);
    load();
  };

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground">Android phones connected as SMS gateways.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-2" />Add Device</Button>
      </div>

      {devices.length === 0 ? (
        <Card className="p-12 text-center">
          <Smartphone className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No devices yet</p>
          <p className="text-sm text-muted-foreground mb-4">Add a device to get a Device ID and Token for your Android app.</p>
          <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-2" />Add Device</Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => {
            const online = isOnline(d.last_seen);
            return (
              <Card key={d.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{d.device_name}</h3>
                    <p className="text-xs text-muted-foreground">{d.manufacturer} {d.model}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${online ? "text-[color:var(--success)]" : "text-muted-foreground"}`}>
                    <span className={`size-2 rounded-full ${online ? "bg-[color:var(--success)] animate-pulse" : "bg-muted-foreground/50"}`} />
                    {online ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-muted rounded px-2 py-1.5">
                    <code className="text-xs truncate">{d.device_id}</code>
                    <button onClick={() => copy(d.device_id)} className="text-muted-foreground hover:text-foreground"><Copy className="size-3.5" /></button>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Battery: {d.battery_level ?? "—"}%</span>
                    <span>Signal: {d.signal_strength ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Last seen: {timeAgo(d.last_seen)}</span>
                    <button onClick={() => remove(d.id)} className="text-destructive hover:underline inline-flex items-center gap-1"><Trash2 className="size-3" />Delete</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Device</DialogTitle></DialogHeader>
          <form onSubmit={addDevice} className="space-y-4">
            <div><Label>Device name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Office Phone" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Manufacturer</Label><Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Tecno" /></div>
              <div><Label>Model</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Spark 10" /></div>
            </div>
            <DialogFooter><Button type="submit">Generate credentials</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showCreds} onOpenChange={(o) => !o && setShowCreds(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Device created</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Copy these into your Android app. The token will <strong>not be shown again</strong>.</p>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Device ID</Label>
              <div className="flex gap-2"><Input readOnly value={showCreds?.deviceId ?? ""} /><Button type="button" variant="outline" onClick={() => copy(showCreds!.deviceId)}><Copy className="size-4" /></Button></div>
            </div>
            <div>
              <Label>Device Token</Label>
              <div className="flex gap-2"><Input readOnly value={showCreds?.token ?? ""} /><Button type="button" variant="outline" onClick={() => copy(showCreds!.token)}><Copy className="size-4" /></Button></div>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setShowCreds(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
