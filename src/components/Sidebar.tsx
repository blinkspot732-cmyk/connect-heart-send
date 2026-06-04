import { Link, useRouter } from "@tanstack/react-router";
import { LayoutDashboard, Smartphone, MessageSquare, KeyRound, BarChart3, LogOut, Webhook, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/devices", label: "Devices", icon: Smartphone },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/webhooks", label: "Webhooks", icon: Webhook },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ email }: { email?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  const NavBody = (
    <>
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">S</div>
        <span className="font-semibold tracking-tight">SimGate</span>
      </div>
      <nav className="flex-1 space-y-1">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
          >
            <n.icon className="size-4" />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="border-t pt-3 mt-3">
        <div className="px-2 pb-2 text-xs text-muted-foreground truncate">{email}</div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
          <LogOut className="size-4 mr-2" /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-bold">S</div>
          <span className="font-semibold">SimGate</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar p-4 flex flex-col shadow-xl">
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </Button>
            </div>
            {NavBody}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar p-4">
        {NavBody}
      </aside>
    </>
  );
}
