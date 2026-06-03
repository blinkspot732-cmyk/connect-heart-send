import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user } = Route.useRouteContext();
  const [email, setEmail] = useState<string | null>(user?.email ?? null);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      if (!session) window.location.href = "/auth";
    });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar email={email} />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
