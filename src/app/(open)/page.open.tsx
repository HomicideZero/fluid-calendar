"use client";

import React from "react";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MatrixRain } from "@/components/landing/MatrixRain";

import { getAppVersion, getVersionGithubUrl } from "@/lib/version";

/**
 * HomicideZero-branded landing for this self-hosted FluidCalendar instance.
 * Reuses the "Claira" code-rain visual from ai.homicidezero.com (a ghostly face
 * emerging from electric-blue glyphs). Org branding leads; the FluidCalendar
 * project credit is condensed into the footer. This file is HZ-only and is
 * never synced upstream.
 */
export default function OpenSourceHomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogin = () => {
    router.push(session ? "/calendar" : "/auth/signin");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#09090b] text-[#e8f4ff]">
      {/* Code-rain canvas with the emerging face */}
      <MatrixRain className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Radial vignette so the center copy stays legible over the rain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(9,9,11,0.86) 0%, rgba(9,9,11,0.6) 42%, rgba(9,9,11,0.15) 78%)",
        }}
      />

      {/* Main */}
      <main className="relative z-10 flex flex-grow flex-col items-center justify-center px-6 py-16">
        <div className="hz-rise w-full max-w-md">
          <div className="rounded-2xl border border-[rgba(120,190,255,0.25)] bg-[rgba(10,14,22,0.55)] px-8 py-10 text-center shadow-[0_0_60px_rgba(30,150,255,0.18)] backdrop-blur-md transition-opacity duration-500 [@media(hover:hover)]:opacity-30 [@media(hover:hover)]:hover:opacity-100">
            {/* Org mark */}
            <div className="mb-7 flex flex-col items-center">
              <h2 className="hz-glow font-mono text-2xl font-bold tracking-[0.18em] text-[#e8f4ff] [text-shadow:0_0_28px_rgba(60,160,255,0.5)]">
                HOMICIDE<span className="text-[#1e96ff]">ZERO</span>
              </h2>
              <span className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.4em] text-[rgba(200,230,255,0.55)]">
                AI Operations
              </span>
            </div>

            {/* Title */}
            <h1 className="mb-3 font-mono text-3xl font-semibold tracking-tight text-[#c8f0ff] [text-shadow:0_0_30px_rgba(60,160,255,0.45)]">
              Fluid Calendar
            </h1>
            <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-[rgba(200,230,255,0.7)]">
              Intelligent task scheduling for the HomicideZero team. Your day,
              planned and replanned automatically.
            </p>

            {/* Sign in */}
            <button
              onClick={handleLogin}
              className="group inline-flex w-full items-center justify-center rounded-lg border border-[rgba(120,200,255,0.5)] bg-[rgba(30,150,255,0.12)] px-8 py-3 font-mono text-sm uppercase tracking-[0.2em] text-[#c8f0ff] transition-all hover:border-[rgba(120,200,255,0.9)] hover:bg-[rgba(30,150,255,0.22)] hover:shadow-[0_0_30px_rgba(60,160,255,0.45)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(120,200,255,0.7)]"
            >
              {session ? "Enter Calendar" : "Sign In"}
              <span className="ml-2 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Condensed project credit */}
      <footer className="relative z-10 px-6 pb-6">
        <p className="text-center font-mono text-[0.7rem] text-[rgba(200,230,255,0.35)]">
          Powered by{" "}
          <Link
            href="https://github.com/dotnetfactory/fluid-calendar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[rgba(120,200,255,0.6)] underline-offset-2 hover:text-[#c8f0ff] hover:underline"
          >
            FluidCalendar
          </Link>{" "}
          · open source ·{" "}
          <Link
            href={getVersionGithubUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[rgba(120,200,255,0.6)] underline-offset-2 hover:text-[#c8f0ff] hover:underline"
            title="View this version on GitHub"
          >
            v{getAppVersion()}
          </Link>
        </p>
      </footer>
    </div>
  );
}
