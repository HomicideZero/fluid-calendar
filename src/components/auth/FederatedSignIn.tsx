"use client";

import { useState } from "react";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

/**
 * HomicideZero sign-in: a single federated (Google) login button. The configured
 * GoogleProvider requests the calendar/tasks scopes, so this both authenticates
 * the user and connects their Google calendar in one step. HZ-only — the public
 * build still uses the email/password SignInForm.
 */
export function FederatedSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    setIsLoading(true);
    void signIn("google", { callbackUrl: "/calendar" });
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="group inline-flex w-full items-center justify-center gap-3 rounded-lg border border-[rgba(120,200,255,0.5)] bg-[rgba(30,150,255,0.12)] px-8 py-3 font-mono text-sm uppercase tracking-[0.2em] text-[#c8f0ff] transition-all hover:border-[rgba(120,200,255,0.9)] hover:bg-[rgba(30,150,255,0.22)] hover:shadow-[0_0_30px_rgba(60,160,255,0.45)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(120,200,255,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FcGoogle className="h-5 w-5" />
      {isLoading ? "Redirecting…" : "Sign in with Google"}
    </button>
  );
}
