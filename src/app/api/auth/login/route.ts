import { NextRequest, NextResponse } from "next/server";
import { userRepo } from "@/lib/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { clearActiveProfileCookie } from "@/lib/profile";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await userRepo.findByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createSessionCookie(user.id);
  // Always re-show "Who's watching" on a fresh sign-in, same as Netflix,
  // rather than trusting a profile cookie left over from a previous session.
  await clearActiveProfileCookie();
  return NextResponse.json({ id: user.id, email: user.email, displayName: user.display_name });
}
