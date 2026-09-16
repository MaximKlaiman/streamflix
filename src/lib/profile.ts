import "server-only";
import { cookies } from "next/headers";
import { profileRepo } from "@/lib/db";

const ACTIVE_PROFILE_COOKIE = "active_profile";
const COOKIE_DURATION_SECONDS = 60 * 60 * 24 * 30; // matches the session cookie

export const MAX_PROFILES = 5;
export const AVATAR_COLORS = ["#E50914", "#0071EB", "#00A86B", "#B26F00", "#8B5CF6"];

export async function setActiveProfileCookie(profileId: number) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, String(profileId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_DURATION_SECONDS,
  });
}

export async function clearActiveProfileCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_PROFILE_COOKIE);
}

// Returns the active profile only if it still exists and belongs to userId -
// guards against a stale/tampered cookie pointing at someone else's profile.
export async function getActiveProfileId(userId: number): Promise<number | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;
  const profileId = raw ? Number(raw) : NaN;
  if (!Number.isInteger(profileId)) return null;

  const profile = profileRepo.findById(profileId);
  if (!profile || profile.user_id !== userId) return null;
  return profileId;
}
