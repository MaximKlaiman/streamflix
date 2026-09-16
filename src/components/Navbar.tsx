"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, ChevronDown, Bell } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const navLinkClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-[15px] font-medium tracking-wide transition ${
      active ? "bg-white/15 text-white" : "text-gray-200 hover:text-white"
    }`;
  // Games and Browse by Languages appear in the reference for visual parity,
  // but nothing in this app backs them (no games catalog, no language
  // filter) - rendered as plain, non-interactive text rather than a link
  // that would go nowhere real.
  const disabledTabClass = "cursor-default rounded-full px-4 py-2 text-[15px] font-medium tracking-wide text-gray-500";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  // Signed-out visitors (the marketing landing page, plus login/signup) get
  // Netflix's minimal pre-auth nav - just the logo and a sign-in link, no
  // Home/Browse/search, since there's nothing to browse before signing in.
  if (!loading && !user) {
    return (
      <nav className="fixed top-0 z-40 flex w-full items-center justify-between py-3 pl-[22px] pr-4 sm:pl-11 sm:pr-8">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-nf-red sm:text-2xl">
          STREAMFLIX
        </Link>
        <Link
          href="/login"
          className="rounded bg-nf-red px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-nf-red-hover"
        >
          Sign In
        </Link>
      </nav>
    );
  }

  return (
    <nav
      className={`fixed top-0 z-40 flex w-full items-center justify-between py-5 pl-[22px] pr-4 transition-colors duration-300 sm:py-6 sm:pl-11 sm:pr-8 ${
        scrolled ? "bg-nf-black" : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-nf-red sm:text-2xl">
          STREAMFLIX
        </Link>
        <div className="hidden items-center gap-1 text-sm md:flex">
          <Link href="/" className={navLinkClass(pathname === "/")}>
            Home
          </Link>
          <Link href="/movies" className={navLinkClass(pathname === "/movies")}>
            Movies
          </Link>
          <Link href="/tv-shows" className={navLinkClass(pathname === "/tv-shows")}>
            TV Shows
          </Link>
          <span className={disabledTabClass}>Games</span>
          <Link href="/new-popular" className={navLinkClass(pathname === "/new-popular")}>
            New &amp; Popular
          </Link>
          {user && (
            <Link href="/my-list" className={navLinkClass(pathname === "/my-list")}>
              My List
            </Link>
          )}
          <span className={disabledTabClass}>Browse by Languages</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={submitSearch} className="flex items-center">
          {searchOpen && (
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => !query && setSearchOpen(false)}
              placeholder="Titles, people, genres"
              className="mr-1 w-36 border border-white/40 bg-black/70 px-2 py-1.5 text-sm text-white outline-none sm:w-56"
            />
          )}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="text-white"
          >
            <Search size={22} />
          </button>
        </form>

        {!loading && user && (
          <div className="relative">
            <button
              aria-label="Notifications"
              onClick={() => setNotifOpen((v) => !v)}
              className="text-white"
            >
              <Bell size={22} />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-64 rounded border border-white/10 bg-nf-black-deep/95 p-4 text-sm shadow-xl">
                <p className="font-semibold text-white">Notifications</p>
                <p className="mt-2 text-gray-400">No notifications yet.</p>
              </div>
            )}
          </div>
        )}

        {!loading && user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded bg-nf-red text-base font-bold text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
              <ChevronDown size={18} className={`text-white transition ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-44 rounded border border-white/10 bg-nf-black-deep/95 py-2 text-sm shadow-xl">
                <p className="truncate px-3 pb-2 text-gray-400">{user.email}</p>
                <Link
                  href="/my-list"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-1.5 text-white hover:bg-white/10"
                >
                  My List
                </Link>
                <Link
                  href="/whos-watching"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-1.5 text-white hover:bg-white/10"
                >
                  Switch Profiles
                </Link>
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    router.push("/");
                  }}
                  className="block w-full px-3 py-1.5 text-left text-white hover:bg-white/10"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
