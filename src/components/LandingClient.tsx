"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingClient({ posters }: { posters: string[] }) {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function getStarted(e: React.FormEvent) {
    e.preventDefault();
    router.push("/signup");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-nf-black">
      {posters.length > 0 && (
        <div className="pointer-events-none absolute inset-0 grid grid-cols-5 gap-1 opacity-70 sm:grid-cols-8">
          {posters.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="aspect-[2/3] w-full object-cover" />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl">
          Endless movies and shows, all in one place
        </h1>
        <p className="mt-4 text-lg text-gray-200 sm:text-xl">Watch anywhere. Cancel anytime.</p>
        <p className="mt-4 max-w-md text-gray-300">Enter your email to create your account and start watching.</p>
        <form onSubmit={getStarted} className="mt-4 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded border border-white/30 bg-black/60 px-4 py-3 text-sm text-white outline-none focus:border-white/60"
          />
          <button
            type="submit"
            className="whitespace-nowrap rounded bg-nf-red px-6 py-3 text-lg font-semibold text-white transition hover:bg-nf-red-hover"
          >
            Get Started &rsaquo;
          </button>
        </form>
      </div>
    </div>
  );
}
