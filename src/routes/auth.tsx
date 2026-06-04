import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  emailSchema, passwordSchema, nameSchema, phoneSchema,
  sanitizeText, getDeviceFingerprint,
} from "@/lib/security";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.navigate({ to: "/dashboard" });
    });
  }, [router]);

  const google = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return toast.error(parsedEmail.error.issues[0].message);
    if (!password) return toast.error("Password required");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsedEmail.data,
      password,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else router.navigate({ to: "/dashboard" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const safeName = sanitizeText(name, 80);
    const parsedName = nameSchema.safeParse(safeName);
    if (!parsedName.success) return toast.error(parsedName.error.issues[0].message);

    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return toast.error(parsedEmail.error.issues[0].message);

    const parsedPhone = phoneSchema.safeParse(phone);
    if (!parsedPhone.success) return toast.error(parsedPhone.error.issues[0].message);

    const parsedPwd = passwordSchema.safeParse(password);
    if (!parsedPwd.success) return toast.error(parsedPwd.error.issues[0].message);

    setLoading(true);

    // Device fingerprint + phone limit check (max 2 per identifier)
    const fingerprint = await getDeviceFingerprint();
    const { data: check, error: checkErr } = await supabase.rpc("check_signup_allowed", {
      _phone: parsedPhone.data,
      _fingerprint: fingerprint,
    });
    if (checkErr) { setLoading(false); return toast.error("Could not verify signup eligibility"); }
    const result = check as { allowed: boolean; reason?: string };
    if (!result.allowed) {
      setLoading(false);
      return toast.error(
        result.reason === "phone_limit"
          ? "This phone number has reached the maximum number of accounts."
          : "This device has reached the maximum number of accounts."
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email: parsedEmail.data,
      password,
      options: {
        data: { name: parsedName.data, phone: parsedPhone.data },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // Record fingerprint+phone for limit tracking
    if (data.user) {
      await supabase.from("signup_registry").insert({
        user_id: data.user.id,
        phone: parsedPhone.data,
        fingerprint,
        email: parsedEmail.data,
      });
    }

    setLoading(false);
    toast.success("Account created. Check your email to confirm.");
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(forgotEmail);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Reset link sent (if account exists)"); setForgotOpen(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="size-10 rounded-xl bg-primary-foreground/15 grid place-items-center font-bold">S</div>
            <span className="text-xl font-semibold">SimGate</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight">SMS Gateway, powered by your Android phones.</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">Turn any Android device into a programmable SMS endpoint. Send OTPs, receive replies, and pipe everything through a clean API.</p>
        </div>
        <p className="text-sm text-primary-foreground/70">© SimGate</p>
      </div>
      <div className="flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="flex lg:hidden items-center gap-2 mb-4">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">S</div>
            <span className="font-semibold">SimGate</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in or create an account.</p>
          <Button variant="outline" className="w-full" onClick={google} disabled={loading}>
            <svg className="size-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" />
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4 mt-4">
                <div><Label>Email</Label><Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div>
                  <div className="flex justify-between"><Label>Password</Label>
                    <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setForgotEmail(email); setForgotOpen(true); }}>Forgot?</button>
                  </div>
                  <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>Sign in</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4 mt-4">
                <div><Label>Name</Label><Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required /></div>
                <div><Label>Email</Label><Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>Phone (international)</Label><Input type="tel" placeholder="+233501234567" required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">8+ chars, upper, lower, number.</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>Create account</Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground mt-6 text-center">
            By continuing you agree to fair-use, no spam, no abuse. Disposable emails are blocked.
          </p>
        </Card>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset your password</DialogTitle></DialogHeader>
          <form onSubmit={sendReset} className="space-y-4">
            <div><Label>Email</Label><Input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={loading}>Send reset link</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Suppress unused-import warning for Link
void Link;
