import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { setActiveProfileCookie } from "@/lib/profile";
import { profileRepo } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to select a profile." }, { status: 401 });

  const profileId = Number((await params).id);
  const profile = await profileRepo.findById(profileId);
  if (!profile || profile.user_id !== userId) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  await setActiveProfileCookie(profileId);
  return NextResponse.json({ ok: true });
}
