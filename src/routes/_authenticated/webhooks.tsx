import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Webhook } from "lucide-react";

export const Route = createFileRoute("/_authenticated/webhooks")({
  component: Webhooks,
});

function Webhooks() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Webhooks</h1>
      <p className="text-muted-foreground mb-8">Receive callbacks when SMS is delivered, failed, or incoming arrives.</p>
      <Card className="p-12 text-center">
        <Webhook className="size-12 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Coming soon</p>
        <p className="text-sm text-muted-foreground">Webhook delivery is on the roadmap.</p>
      </Card>
    </div>
  );
}
