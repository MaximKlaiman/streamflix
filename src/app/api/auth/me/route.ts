import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { userRepo } from "@/lib/db";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ user: null });

  const user = await userRepo.findById(userId);
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user: { id: user.id, email: user.email, displayName: user.display_name } });
}
