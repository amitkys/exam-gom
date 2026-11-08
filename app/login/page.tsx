import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IconBook2, IconCircleCheck, IconShieldCheck } from "@tabler/icons-react";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./_components/main-form";

export const metadata: Metadata = { title: "Sign in" };

async function SignIn() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative flex flex-col overflow-hidden bg-[#082f3d] px-7 py-8 text-white sm:px-12 lg:px-16 lg:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_70%,#155769_0%,transparent_65%)]" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-white/20 bg-white/10"><IconBook2 className="size-6" aria-hidden="true" /></span>
          <span className="text-xl font-semibold tracking-tight">ExamGom<span className="text-cyan-300">.</span></span>
        </div>
        <div className="relative my-auto max-w-lg py-14 lg:py-20">
          <p className="mb-5 text-xs font-medium tracking-[0.2em] text-cyan-200 uppercase">Examination management</p>
          <h2 className="text-4xl leading-[1.14] font-medium tracking-tight sm:text-5xl xl:text-6xl">Every examination.<br /><span className="text-cyan-200">One secure<br className="hidden lg:block" /> workspace.</span></h2>
          <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">A dedicated space for the people behind every examination. Sign in to continue your work.</p>
          <div className="mt-10 hidden max-w-sm rounded-2xl border border-white/15 bg-white/5 p-5 lg:block">
            <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
              <IconShieldCheck className="size-5 text-cyan-200" aria-hidden="true" />
              <span className="text-sm font-medium">Access with confidence</span>
            </div>
            <div className="space-y-4 text-sm text-slate-200">
              {['Administrator-managed accounts', 'Role-based workspace access', 'Secure, private sessions'].map((text) => (
                <p key={text} className="flex items-center gap-3"><IconCircleCheck className="size-4 text-cyan-200" aria-hidden="true" />{text}</p>
              ))}
            </div>
          </div>
        </div>
        <p className="relative hidden text-xs text-slate-400 lg:block">Built for a more organized examination process.</p>
      </section>
      <section className="flex flex-col justify-between bg-[#fafcfc] px-7 py-8 sm:px-12 lg:px-16 lg:py-12">
        <p className="text-right text-xs font-medium tracking-wider text-muted-foreground uppercase">Institution access</p>
        <div className="mx-auto w-full max-w-sm py-14">
          <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Preparing sign-in…</p>}><SignIn /></Suspense>
        </div>
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><IconShieldCheck className="size-4" aria-hidden="true" />For authorized institution members only</p>
      </section>
    </main>
  );
}
