import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Code2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api-base";

export const Route = createFileRoute("/_authenticated/developers")({
  component: DevelopersPage,
});

const copy = (s: string) => {
  navigator.clipboard.writeText(s);
  toast.success("Copied");
};

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition">
        <Button size="sm" variant="secondary" onClick={() => copy(code)}>
          <Copy className="size-3.5" />
        </Button>
      </div>
      <pre className="bg-muted text-foreground rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{lang}</div>
    </div>
  );
}

function DevelopersPage() {
  const curl = `curl -X POST ${API_BASE}/send-sms \\
  -H "X-Device-Id: dev_xxxxxxxxxxxxxxxx" \\
  -H "X-Device-Token: dtk_xxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "recipient": "+254712345678", "message": "Hello from SimGate" }'`;

  const js = `const res = await fetch("${API_BASE}/send-sms", {
  method: "POST",
  headers: {
    "X-Device-Id": process.env.SIMGATE_DEVICE_ID,
    "X-Device-Token": process.env.SIMGATE_DEVICE_TOKEN,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ recipient: "+254712345678", message: "Hello" }),
});
const data = await res.json();
console.log(data); // { success, message_id, status, remaining }`;

  const php = `<?php
$ch = curl_init("${API_BASE}/send-sms");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "X-Device-Id: " . getenv("SIMGATE_DEVICE_ID"),
    "X-Device-Token: " . getenv("SIMGATE_DEVICE_TOKEN"),
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "recipient" => "+254712345678",
    "message"   => "Hello",
  ]),
]);
echo curl_exec($ch);`;

  const py = `import os, requests
r = requests.post("${API_BASE}/send-sms",
    headers={
        "X-Device-Id": os.environ["SIMGATE_DEVICE_ID"],
        "X-Device-Token": os.environ["SIMGATE_DEVICE_TOKEN"],
    },
    json={"recipient": "+254712345678", "message": "Hello"})
print(r.json())`;

  const webhookPayload = `{
  "event": "sms.sent",
  "message_id": "uuid",
  "recipient": "+254712345678",
  "status": "sent",
  "sent_at": "2026-06-07T10:00:00Z"
}`;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Code2 className="size-7 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Developer Documentation</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Send SMS from your website or backend using your phone as the gateway. No API keys needed — just your Device ID and Device Token.
      </p>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Base URL</h2>
        <div className="flex items-center gap-2 bg-muted rounded px-3 py-2">
          <code className="text-sm flex-1">{API_BASE}</code>
          <Button size="sm" variant="ghost" onClick={() => copy(API_BASE)}><Copy className="size-3.5" /></Button>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Authentication</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Every request must include two headers from the device you created on the <a href="/devices" className="text-primary underline">Devices</a> page:
        </p>
        <ul className="text-sm space-y-1 mb-4 list-disc pl-5">
          <li><code className="bg-muted px-1.5 py-0.5 rounded">X-Device-Id</code> — starts with <code>dev_</code></li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded">X-Device-Token</code> — starts with <code>dtk_</code>, shown once at creation</li>
        </ul>
        <p className="text-xs text-muted-foreground">Basic auth fallback: <code>Authorization: Basic base64(device_id:device_token)</code></p>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Phone Number Format</h2>
        <p className="text-sm text-muted-foreground mb-3">All recipients must be in <strong>E.164</strong> international format.</p>
        <div className="bg-muted rounded p-3 text-sm font-mono mb-3">^\+?[1-9]\d{`{6,14}`}$</div>
        <table className="text-sm w-full">
          <thead className="text-left text-muted-foreground border-b">
            <tr><th className="py-2">Country</th><th>Example</th><th>Notes</th></tr>
          </thead>
          <tbody className="divide-y">
            <tr><td className="py-2">Kenya</td><td><code>+254712345678</code></td><td>Drop the leading 0</td></tr>
            <tr><td className="py-2">Nigeria</td><td><code>+2348012345678</code></td><td>Drop the leading 0</td></tr>
            <tr><td className="py-2">USA</td><td><code>+14155552671</code></td><td>+1 then area code</td></tr>
            <tr><td className="py-2">UK</td><td><code>+447700900123</code></td><td>+44 then mobile</td></tr>
            <tr><td className="py-2">India</td><td><code>+919876543210</code></td><td>+91 then mobile</td></tr>
          </tbody>
        </table>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Send SMS</h2>
        <div className="text-sm mb-3">
          <span className="inline-block bg-[color:var(--success)]/15 text-[color:var(--success)] font-mono text-xs px-2 py-0.5 rounded mr-2">POST</span>
          <code>{API_BASE}/send-sms</code>
        </div>
        <div className="grid gap-4">
          <CodeBlock lang="cURL" code={curl} />
          <CodeBlock lang="JavaScript / Node.js" code={js} />
          <CodeBlock lang="PHP" code={php} />
          <CodeBlock lang="Python" code={py} />
        </div>
        <h3 className="font-semibold mt-6 mb-2">Response</h3>
        <CodeBlock lang="200 OK" code={`{
  "success": true,
  "message_id": "uuid",
  "status": "queued",
  "tier": "free",
  "limit": 20,
  "remaining": 19
}`} />
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Rate Limits</h2>
        <p className="text-sm text-muted-foreground mb-3">Every response includes these headers:</p>
        <ul className="text-sm space-y-1 mb-3 list-disc pl-5">
          <li><code>X-RateLimit-Limit</code> — your daily quota</li>
          <li><code>X-RateLimit-Remaining</code> — sends left today</li>
          <li><code>X-RateLimit-Tier</code> — free, starter, pro, business</li>
        </ul>
        <p className="text-sm">When exceeded, the API returns <strong>HTTP 429</strong>. Upgrade on the <a href="/billing" className="text-primary underline">Billing</a> page.</p>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Webhooks</h2>
        <p className="text-sm text-muted-foreground mb-3">Configure on the Webhooks page. Every delivery includes:</p>
        <ul className="text-sm space-y-1 mb-3 list-disc pl-5">
          <li><code>X-Webhook-Signature: sha256=...</code> — HMAC of the body using your endpoint secret</li>
          <li><code>X-Webhook-Event</code> — sms.sent, sms.delivered, or sms.failed</li>
          <li><code>X-Webhook-Delivery</code> — unique delivery id</li>
        </ul>
        <CodeBlock lang="Payload" code={webhookPayload} />
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Error Codes</h2>
        <table className="text-sm w-full">
          <thead className="text-left text-muted-foreground border-b">
            <tr><th className="py-2">Status</th><th>Meaning</th></tr>
          </thead>
          <tbody className="divide-y">
            <tr><td className="py-2 font-mono">400</td><td>Invalid recipient or message body</td></tr>
            <tr><td className="py-2 font-mono">401</td><td>Missing or invalid device credentials</td></tr>
            <tr><td className="py-2 font-mono">403</td><td>Device deactivated</td></tr>
            <tr><td className="py-2 font-mono">404</td><td>Device not found</td></tr>
            <tr><td className="py-2 font-mono">429</td><td>Daily quota exceeded</td></tr>
            <tr><td className="py-2 font-mono">500</td><td>Internal error</td></tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
