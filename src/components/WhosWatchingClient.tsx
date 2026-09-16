"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";

interface Profile {
  id: number;
  name: string;
  avatarColor: string;
}

const MAX_PROFILES = 5;

export default function WhosWatchingClient({ profiles: initialProfiles }: { profiles: Profile[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [managing, setManaging] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function select(id: number) {
    if (managing) return;
    const res = await fetch(`/api/profiles/${id}/select`, { method: "POST" });
    if (res.ok) router.push("/");
  }

  function startEdit(p: Profile) {
    setEditingId(p.id);
    setNameDraft(p.name);
    setError(null);
  }

  async function saveEdit(id: number) {
    if (!nameDraft.trim()) return;
    const res = await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDraft.trim() }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, name: nameDraft.trim() } : p)));
      setEditingId(null);
    }
  }

  async function remove(id: number) {
    const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setEditingId(null);
    }
  }

  async function createProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!nameDraft.trim()) return;
    setError(null);
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDraft.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't add that profile.");
      return;
    }
    setProfiles((prev) => [...prev, data]);
    setAdding(false);
    setNameDraft("");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-nf-black px-4">
      <h1 className="mb-10 text-3xl font-medium text-white sm:text-5xl">Who&apos;s watching?</h1>

      <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
        {profiles.map((p) => (
          <div key={p.id} className="group flex w-24 flex-col items-center gap-2 sm:w-32">
            {editingId === p.id ? (
              <>
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded text-3xl font-bold text-white opacity-50 sm:h-32 sm:w-32"
                  style={{ backgroundColor: p.avatarColor }}
                >
                  {p.name.charAt(0).toUpperCase()}
                  <button
                    onClick={() => remove(p.id)}
                    aria-label={`Delete ${p.name}`}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(p.id)}
                  className="w-full rounded border border-white/30 bg-black/60 px-2 py-1 text-center text-sm text-white outline-none focus:border-white/70"
                />
                <button
                  onClick={() => saveEdit(p.id)}
                  className="text-xs font-semibold text-gray-300 hover:text-white"
                >
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => (managing ? startEdit(p) : select(p.id))}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`relative flex h-24 w-24 items-center justify-center rounded text-3xl font-bold text-white transition sm:h-32 sm:w-32 ${
                    managing ? "opacity-60" : "group-hover:ring-4 group-hover:ring-white"
                  }`}
                  style={{ backgroundColor: p.avatarColor }}
                >
                  {p.name.charAt(0).toUpperCase()}
                  {managing && <Pencil className="absolute" size={28} />}
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white sm:text-base">{p.name}</span>
              </button>
            )}
          </div>
        ))}

        {profiles.length < MAX_PROFILES &&
          (adding ? (
            <form onSubmit={createProfile} className="flex w-24 flex-col items-center gap-2 sm:w-32">
              <div className="flex h-24 w-24 items-center justify-center rounded border-2 border-dashed border-white/30 bg-black/40 sm:h-32 sm:w-32">
                <Plus className="text-gray-400" size={32} />
              </div>
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Name"
                className="w-full rounded border border-white/30 bg-black/60 px-2 py-1 text-center text-sm text-white outline-none focus:border-white/70"
              />
              <button type="submit" className="text-xs font-semibold text-gray-300 hover:text-white">
                Add
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setAdding(true);
                setNameDraft("");
                setError(null);
              }}
              className="group flex w-24 flex-col items-center gap-2 sm:w-32"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded border-2 border-white/20 bg-black/40 transition group-hover:border-white/60 sm:h-32 sm:w-32">
                <Plus className="text-gray-400 group-hover:text-white" size={32} />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-white sm:text-base">Add Profile</span>
            </button>
          ))}
      </div>

      {error && <p className="mt-6 text-sm text-nf-red">{error}</p>}

      <button
        onClick={() => {
          setManaging((v) => !v);
          setEditingId(null);
          setAdding(false);
        }}
        className="mt-12 rounded border border-gray-500 px-4 py-2 text-sm font-medium uppercase tracking-wide text-gray-400 transition hover:border-white hover:text-white"
      >
        {managing ? "Done" : "Manage Profiles"}
      </button>
    </div>
  );
}
