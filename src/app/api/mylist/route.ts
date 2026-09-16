import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { myListRepo } from "@/lib/db";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to view your list." }, { status: 401 });

  const items = await myListRepo.listFor(userId);
  return NextResponse.json({
    items: items.map((i) => ({
      tmdbId: i.tmdb_id,
      mediaType: i.media_type,
      title: i.title,
      posterPath: i.poster_path,
      addedAt: i.added_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to save titles." }, { status: 401 });

  const { tmdbId, mediaType, title, posterPath } = await req.json().catch(() => ({}));
  if (typeof tmdbId !== "number" || typeof mediaType !== "string" || typeof title !== "string") {
    return NextResponse.json({ error: "Missing tmdbId, mediaType, or title." }, { status: 400 });
  }

  await myListRepo.add(userId, { tmdbId, mediaType, title, posterPath: posterPath ?? null });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to manage your list." }, { status: 401 });

  const tmdbId = Number(req.nextUrl.searchParams.get("tmdbId"));
  const mediaType = req.nextUrl.searchParams.get("mediaType") ?? "";
  if (!tmdbId || !mediaType) {
    return NextResponse.json({ error: "Missing tmdbId or mediaType." }, { status: 400 });
  }

  await myListRepo.remove(userId, tmdbId, mediaType);
  return NextResponse.json({ ok: true });
}
