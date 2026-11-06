import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, needsInitialSetup } from "@/lib/auth";
import { LoginForm, FirstAdminForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in: go straight to the dashboard rather than showing a
  // form that would just bounce back.
  if (await getCurrentUser()) redirect("/");

  const firstRun = await needsInitialSetup();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <p className="text-brand text-xs font-semibold tracking-[0.18em] uppercase">
            Rayan Premium Mobility
          </p>
          <h1 className="mt-2 text-2xl">{firstRun ? "Create your account" : "Dashboard"}</h1>
          <p className="text-ink-muted mt-1.5 text-sm">
            {firstRun
              ? "No account exists yet. This first one becomes the administrator."
              : "Sign in to manage the website."}
          </p>
        </div>

        <div className="card card-pad">{firstRun ? <FirstAdminForm /> : <LoginForm />}</div>

        <p className="text-ink-faint mt-5 text-center text-xs">
          This area is private and is never indexed by search engines.
        </p>
      </div>
    </main>
  );
}
