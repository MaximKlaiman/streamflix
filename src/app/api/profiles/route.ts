import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { AVATAR_COLORS, MAX_PROFILES } from "@/lib/profile";
import { profileRepo } from "@/lib/db";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to view profiles." }, { status: 401 });

  const profiles = profileRepo.listForUser(userId);
  return NextResponse.json({
    profiles: profiles.map((p) => ({ id: p.id, name: p.name, avatarColor: p.avatar_color })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to add a profile." }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "A profile name is required." }, { status: 400 });
  }

  const existing = profileRepo.listForUser(userId);
  if (existing.length >= MAX_PROFILES) {
    return NextResponse.json({ error: `You can only have up to ${MAX_PROFILES} profiles.` }, { status: 400 });
  }

  const color = AVATAR_COLORS[existing.length % AVATAR_COLORS.length];
  const profile = profileRepo.create(userId, name.trim().slice(0, 40), color);
  return NextResponse.json({ id: profile.id, name: profile.name, avatarColor: profile.avatar_color });
}
