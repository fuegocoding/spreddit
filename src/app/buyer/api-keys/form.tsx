"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IconCopy, IconCheck } from "@tabler/icons-react";

export function ApiKeyForm({
  action,
}: {
  action: (fd: FormData) => Promise<{ key: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const { key } = await action(formData);
        setCreated(key);
        toast.success("API key created. Copy it now — you won't see it again.");
      } catch (e: any) {
        toast.error(e.message ?? "Failed to create key");
      }
    });
  }

  if (created) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <div className="font-medium">Your new API key</div>
          <div className="mt-1 text-xs text-muted-foreground">Copy it now. We only show it once.</div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-muted px-2 py-1 font-mono text-xs">{created}</code>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                navigator.clipboard.writeText(created);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
            </Button>
          </div>
        </div>
        <Button variant="outline" onClick={() => setCreated(null)}>Create another</Button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="agent-claude-code" className="mt-2" />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create key"}</Button>
    </form>
  );
}