"use client";

import { useState } from "react";
import { IconCopy, IconCheck, IconTerminal } from "@tabler/icons-react";

export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const cmd = "npx spreddit-mcp add";

  function copy() {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-10 w-full max-w-xl">
      <div className="rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm text-left flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <IconTerminal className="size-4 text-primary shrink-0" />
          <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold shrink-0">
            Install
          </span>
          <code className="text-foreground truncate">{cmd}</code>
        </div>
        <button
          onClick={copy}
          className="shrink-0 grid size-8 place-items-center rounded-md hover:bg-muted transition-colors"
          aria-label="Copy command"
        >
          {copied ? (
            <IconCheck className="size-4 text-primary" />
          ) : (
            <IconCopy className="size-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}