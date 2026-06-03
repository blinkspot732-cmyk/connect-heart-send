import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, KeyRound } from "lucide-react";
import { generateApiKey, sha256Hex, timeAgo } from "@/lib/credentials";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/api-keys")({
  component: ApiKeys,
});

function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    setKeys(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const key = generateApiKey();
    const hash = await sha256Hex(key);
    const { error } = await supabase.from("api_keys").insert({
      user_id: user.id,
      name: name || "Untitled key",
      api_key_hash: hash,
      key_prefix: "sk_live_",
      key_last4: key.slice(-4),
      active: true,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setName(""); setNewKey(key); load();
  };

  const toggle = async (k: any) => {
    await supabase.from("api_keys").update({ active: !k.active }).eq("id", k.id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this key?")) return;
    await supabase.from("api_keys").delete().eq("id", id);
    load();
  };
  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">Use these to call <code>/functions/v1/send-sms</code>.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-2" />New Key</Button>
      </div>
      {keys.length === 0 ? (
        <Card className="p-12 text-center">
          <KeyRound className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No keys yet</p>
          <Button className="mt-3" onClick={() => setOpen(true)}><Plus className="size-4 mr-2" />Create key</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <Card key={k.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{k.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{k.key_prefix}••••{k.key_last4}</p>
                <p className="text-xs text-muted-foreground">Created {timeAgo(k.created_at)} · Last used {timeAgo(k.last_used_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toggle(k)}>{k.active ? "Disable" : "Enable"}</Button>
                <Button variant="ghost" size="icon" onClick={() => remove(k.id)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create API Key</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production server" /></div>
            <DialogFooter><Button type="submit">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newKey} onOpenChange={(o) => !o && setNewKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Save this key</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">You won't be able to see it again.</p>
          <div className="flex gap-2 mt-2">
            <Input readOnly value={newKey ?? ""} className="font-mono" />
            <Button variant="outline" onClick={() => copy(newKey!)}><Copy className="size-4" /></Button>
          </div>
          <DialogFooter><Button onClick={() => setNewKey(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
