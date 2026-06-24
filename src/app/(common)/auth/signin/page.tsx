import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { FederatedSignIn } from "@/components/auth/FederatedSignIn";
import { MatrixRain } from "@/components/landing/MatrixRain";

import { getAuthOptions } from "@/lib/auth/auth-options";

export const metadata = {
  title: "Sign In | HomicideZero",
  description: "Sign in to the HomicideZero operations calendar",
};

export default async function SignInPage() {
  // Check if user is already signed in
  const authOptions = await getAuthOptions();
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/calendar");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#09090b] px-4 py-12">
      {/* Code-rain with the emerging face — same skin as the root landing */}
      <MatrixRain className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Radial vignette so the card stays legible over the rain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(9,9,11,0.86) 0%, rgba(9,9,11,0.6) 42%, rgba(9,9,11,0.15) 78%)",
        }}
      />

      <div className="hz-rise relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-[rgba(120,190,255,0.25)] bg-[rgba(10,14,22,0.55)] px-8 py-10 text-center shadow-[0_0_60px_rgba(30,150,255,0.18)] backdrop-blur-md transition-opacity duration-500 [@media(hover:hover)]:opacity-30 [@media(hover:hover)]:hover:opacity-100">
          {/* Org mark */}
          <div className="mb-6 flex flex-col items-center">
            <h2 className="hz-glow font-mono text-2xl font-bold tracking-[0.18em] text-[#e8f4ff] [text-shadow:0_0_28px_rgba(60,160,255,0.5)]">
              HOMICIDE<span className="text-[#1e96ff]">ZERO</span>
            </h2>
            <span className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.4em] text-[rgba(200,230,255,0.55)]">
              AI Operations
            </span>
          </div>

          <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-[rgba(200,230,255,0.7)]">
            Homicide Zero uses company federated login. Sign in with your
            organization Google account to continue.
          </p>

          <FederatedSignIn />
        </div>
      </div>
    </div>
  );
}
