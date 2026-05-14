"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-gold-200 bg-white px-3 py-2">
      <code className="font-mono text-sm font-semibold tabular-nums text-navy-900">{code}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            // ignore
          }
        }}
        className="inline-flex items-center gap-1 rounded-md border border-navy-200 bg-white px-2 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50"
      >
        <Copy className="h-3 w-3" />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
