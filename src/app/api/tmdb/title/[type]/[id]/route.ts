import { NextRequest, NextResponse } from "next/server";
import { getTitleDetail, type MediaType } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  if (type !== "movie" && type !== "tv") {
    return NextResponse.json({ error: "Invalid media type." }, { status: 400 });
  }
  try {
    const detail = await getTitleDetail(Number(id), type as MediaType);
    return NextResponse.json(detail);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TMDB request failed." },
      { status: 502 }
    );
  }
}
