"use server";

import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { requireUser } from "@/lib/auth";
import { isMediaConfigured } from "@/lib/media";
import { fail, ok, type FormState } from "@/lib/form-state";

/**
 * Image uploads, stored in Vercel Blob.
 *
 * Writing into `public/` is not an option: on serverless the filesystem is
 * read-only and per-instance, so a file written during one request is gone by
 * the next and was never visible to any other instance. Object storage is the
 * only thing that actually works, and Blob is the one already available where
 * this is deployed.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];

export async function uploadMedia(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();

  if (!isMediaConfigured()) {
    return fail("Uploads are not set up yet — see the instructions on this page.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose an image to upload.");
  }

  if (!ALLOWED.includes(file.type)) {
    return fail(
      `${file.type || "That file"} cannot be used on the website. Use a JPEG, PNG, WebP, AVIF or SVG.`,
    );
  }

  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return fail(
      `That image is ${mb} MB, over the 8 MB limit. Resize it before uploading — anything much above 1 MB slows the page down anyway.`,
    );
  }

  try {
    // `addRandomSuffix` keeps two files of the same name from overwriting
    // each other, which otherwise silently replaces a photograph already in
    // use somewhere on the site.
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    revalidatePath("/media");
    return ok(`Uploaded. Its address is ${blob.url}`);
  } catch (error) {
    const detail =
      error instanceof Error ? (error.message.split(/\r?\n/)[0] ?? error.message) : "Unknown error";
    return fail(`Upload failed: ${detail}`);
  }
}

export async function deleteMedia(formData: FormData): Promise<void> {
  await requireUser();
  if (!isMediaConfigured()) return;

  const url = formData.get("url");
  if (typeof url !== "string" || url.length === 0) return;

  await del(url);
  revalidatePath("/media");
}
