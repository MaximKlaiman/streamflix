import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-nf-black pt-24" />}>
      <SearchClient />
    </Suspense>
  );
}
