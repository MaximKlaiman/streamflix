import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { clearActiveProfileCookie } from "@/lib/profile";

export async function POST() {
  await clearSessionCookie();
  await clearActiveProfileCookie();
  return NextResponse.json({ ok: true });
}
