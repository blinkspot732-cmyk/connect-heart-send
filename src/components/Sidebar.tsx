import { Link, useRouter } from "@tanstack/react-router";
import { LayoutDashboard, Smartphone, MessageSquare, KeyRound, BarChart3, LogOut, Webhook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar p-4">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">S</div>
        <span className="font-semibold tracking-tight">SimGate</span>
      </div>
      <nav className="flex-1 space-y-1">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
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
    </aside>
  );
}
