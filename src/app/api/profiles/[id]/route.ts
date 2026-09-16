import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { clearActiveProfileCookie, getActiveProfileId } from "@/lib/profile";
import { profileRepo } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to edit profiles." }, { status: 401 });

  const profileId = Number((await params).id);
  const profile = profileRepo.findById(profileId);
  if (!profile || profile.user_id !== userId) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const { name } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "A profile name is required." }, { status: 400 });
  }

  profileRepo.rename(profileId, name.trim().slice(0, 40));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to delete profiles." }, { status: 401 });

  const profileId = Number((await params).id);
  const profile = profileRepo.findById(profileId);
  if (!profile || profile.user_id !== userId) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  profileRepo.remove(profileId);

  const activeProfileId = await getActiveProfileId(userId);
  if (activeProfileId === profileId) await clearActiveProfileCookie();

  return NextResponse.json({ ok: true });
}
