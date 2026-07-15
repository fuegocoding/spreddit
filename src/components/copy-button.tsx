"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "@tabler/icons-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 grid size-7 place-items-center rounded-md hover:bg-muted transition-colors"
      aria-label="Copy"
    >
      {copied ? (
        <IconCheck className="size-4 text-primary" />
      ) : (
        <IconCopy className="size-4 text-muted-foreground" />
      )}
    </button>
  );
}