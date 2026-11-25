"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { initialFormState } from "@/lib/form-state";
import { FormShell } from "@/components/form";
import { uploadMedia } from "./actions";

/**
 * Picking a file and uploading it.
 *
 * The chosen file's name and size are shown before the upload runs, because
 * the most common mistake is a 12 MB photograph straight off a phone — and
 * the moment to notice that is before waiting for it to transfer.
 */
export function UploadForm() {
  const [chosen, setChosen] = useState<{ name: string; mb: string } | null>(null);

  return (
    <FormShell action={uploadMedia} initialState={initialFormState}>
      <div className="field-span">
        <label htmlFor="file" className="label">
          Image
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
          className="input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setChosen(file ? { name: file.name, mb: (file.size / 1024 / 1024).toFixed(1) } : null);
          }}
        />
        <span className="hint">
          JPEG, PNG, WebP, AVIF or SVG, up to 8 MB. Anything much above 1 MB will slow the page
          down, so resize large photographs first.
        </span>

        {chosen ? (
          <p className={`mt-2 text-sm ${Number(chosen.mb) > 1 ? "text-warn" : "text-ink-muted"}`}>
            <Upload size={13} aria-hidden="true" className="mr-1 inline" />
            {chosen.name} — {chosen.mb} MB
            {Number(chosen.mb) > 1 ? " (large; consider resizing)" : ""}
          </p>
        ) : null}
      </div>
    </FormShell>
  );
}
