"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { claimPostAction } from "@/app/poster/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Account = { id: string; username: string; karma: number };

export function ClaimButton({
  postId,
  accounts,
}: {
  postId: string;
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(accounts[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClaim() {
    if (!selected) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("postId", postId);
        fd.set("redditAccountId", selected);
        const result = await claimPostAction(fd);
        toast.success("Post claimed! You have 60 minutes to publish.");
        if (result?.claimId) {
          router.push(`/poster/claims/${result.claimId}`);
        } else {
          router.push("/poster");
        }
      } catch (e: any) {
        toast.error(e.message ?? "Failed to claim post");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="w-full">
            Claim
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim this post</DialogTitle>
          <DialogDescription>
            Pick which Reddit account to publish with. You have 60 minutes to
            publish and submit proof.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {accounts.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/5"
            >
              <input
                type="radio"
                name="redditAccount"
                value={a.id}
                checked={selected === a.id}
                onChange={() => setSelected(a.id)}
                className="size-4"
              />
              <div className="flex-1">
                <div className="font-medium">u/{a.username}</div>
                <div className="text-xs text-muted-foreground">
                  {a.karma.toLocaleString()} karma
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClaim} disabled={pending || !selected}>
            {pending ? "Claiming…" : "Claim and publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
