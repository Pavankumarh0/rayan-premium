import "server-only";

import { list } from "@vercel/blob";

/**
 * Reads of the media store.
 *
 * Separate from the upload and delete actions because a `"use server"` module
 * may only export async functions — a synchronous `isConfigured` in there
 * fails the build, and a type export would be erased before it could help.
 * The same trap caught `initialEnquiryState` earlier in this project.
 */

export type MediaItem = {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
};

/** Blob is configured by the presence of its token; nothing else to check. */
export function isMediaConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function listMedia(): Promise<MediaItem[]> {
  if (!isMediaConfigured()) return [];

  const { blobs } = await list({ limit: 200 });
  return blobs
    .map((b) => ({
      url: b.url,
      pathname: b.pathname,
      size: b.size,
      uploadedAt: b.uploadedAt,
    }))
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}
