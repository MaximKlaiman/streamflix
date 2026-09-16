"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-nf-black px-6 text-center">
      <h1 className="text-2xl font-bold text-white">Something went wrong loading Streamflix</h1>
      <p className="max-w-md text-sm text-gray-400">
        This usually means <code className="text-gray-300">TMDB_ACCESS_TOKEN</code> is missing or invalid in
        your <code className="text-gray-300">.env.local</code>, or TMDB couldn&apos;t be reached. Check the
        server logs for details.
      </p>
      <button
        onClick={reset}
        className="rounded bg-nf-red px-5 py-2 font-semibold text-white transition hover:bg-nf-red-hover"
      >
        Try again
      </button>
    </div>
  );
}
