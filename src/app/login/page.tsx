"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Something went wrong (server returned ${res.status}).`);
        return;
      }
      await refresh();
      router.push("/");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-nf-black px-4">
      <div className="w-full max-w-sm rounded-md bg-black/75 p-8 pt-24 sm:pt-8">
        <h1 className="mb-6 text-2xl font-bold text-white">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded border border-white/20 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-white/60"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded border border-white/20 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-white/60"
          />
          {error && <p className="text-sm text-nf-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-nf-red py-3 font-semibold text-white transition hover:bg-nf-red-hover disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-sm text-gray-400">
          New to Streamflix?{" "}
          <Link href="/signup" className="text-white hover:underline">
            Sign up now
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
