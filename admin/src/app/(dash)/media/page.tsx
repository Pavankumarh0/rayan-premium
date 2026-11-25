import type { Metadata } from "next";
import Image from "next/image";
import { AlertCircle, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { UploadForm } from "./upload-form";
import { CopyUrl } from "./copy-url";
import { isMediaConfigured, listMedia } from "@/lib/media";
import { deleteMedia } from "./actions";

export const metadata: Metadata = { title: "Media" };
export const dynamic = "force-dynamic";

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function MediaPage() {
  await requireUser();

  const configured = isMediaConfigured();
  const items = await listMedia();

  return (
    <>
      <PageHeader
        title="Media"
        description="Upload an image here, then paste its address into any image field on the site."
      />

      {!configured ? (
        <div className="notice notice-warn mb-5">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Uploads are not set up yet.</p>
            <p className="mt-1 text-sm">
              Images need somewhere to live. The site runs on serverless, where the filesystem is
              read-only and discarded between requests, so a file cannot simply be saved into the
              project — it would vanish, and would never have been visible to anyone else.
            </p>
            <p className="mt-2 text-sm">To finish the setup, once:</p>
            <ol className="mt-1 ml-5 list-decimal text-sm">
              <li>In Vercel, open this project, then Storage, then create a Blob store.</li>
              <li>
                Vercel adds a <code>BLOB_READ_WRITE_TOKEN</code> to that project automatically.
              </li>
              <li>Copy the same variable into the dashboard project, then redeploy both.</li>
            </ol>
            <p className="mt-2 text-sm">
              Until then images can still be used, by committing them to the public site&rsquo;s{" "}
              <code>public/</code> folder and typing the path by hand.
            </p>
          </div>
        </div>
      ) : (
        <section className="card card-pad mb-5">
          <h2 className="border-line mb-4 border-b pb-2 text-base">Upload</h2>
          <UploadForm />
        </section>
      )}

      {configured && items.length === 0 ? (
        <EmptyState
          title="Nothing uploaded yet"
          description="Images you upload appear here with their address, ready to paste into any image field."
        />
      ) : null}

      {configured && items.length > 0 ? (
        <section className="card card-pad">
          <h2 className="border-line mb-4 border-b pb-2 text-base">
            Uploaded
            <span className="text-ink-faint ml-2 text-sm font-normal">
              {items.length} {items.length === 1 ? "image" : "images"}
            </span>
          </h2>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.url} className="border-line overflow-hidden rounded-md border">
                <span className="bg-surface-sunken relative block aspect-[4/3]">
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 280px, 45vw"
                    unoptimized
                    className="object-cover"
                  />
                </span>
                <div className="p-3">
                  <p className="truncate text-sm font-medium" title={item.pathname}>
                    {item.pathname}
                  </p>
                  <p className="text-ink-faint mt-0.5 text-xs">{size(item.size)}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <CopyUrl url={item.url} />
                    <form action={deleteMedia}>
                      <input type="hidden" name="url" value={item.url} readOnly />
                      <button type="submit" className="btn btn-ghost btn-sm text-danger">
                        <Trash2 size={13} aria-hidden="true" />
                        <span className="sr-only">Delete {item.pathname}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-ink-faint mt-4 text-sm">
            Deleting an image here does not remove it from any page still using it — that page
            will show a broken image until its field is changed.
          </p>
        </section>
      ) : null}
    </>
  );
}
