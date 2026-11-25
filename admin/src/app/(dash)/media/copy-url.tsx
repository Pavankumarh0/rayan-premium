"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies an uploaded image's address, which is the whole point of the page. */
export function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard access can be refused. The address is in the title
          // attribute either way, so selecting it by hand still works.
        }
      }}
      title={url}
    >
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      {copied ? "Copied" : "Copy address"}
    </button>
  );
}
