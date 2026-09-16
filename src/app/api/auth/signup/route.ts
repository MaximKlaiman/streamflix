import { NextRequest, NextResponse } from "next/server";
import { userRepo, profileRepo } from "@/lib/db";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { AVATAR_COLORS, clearActiveProfileCookie } from "@/lib/profile";

export async function POST(req: NextRequest) {
  const { email, password, displayName } = await req.json().catch(() => ({}));

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  const name = typeof displayName === "string" && displayName.trim() ? displayName.trim() : email.split("@")[0];

  if (userRepo.findByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = userRepo.create(email, passwordHash, name);
  profileRepo.create(user.id, name, AVATAR_COLORS[0]);
  await createSessionCookie(user.id);
  await clearActiveProfileCookie();

  return NextResponse.json({ id: user.id, email: user.email, displayName: user.display_name });
}
