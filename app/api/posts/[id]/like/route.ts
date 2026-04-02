import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

// POST /api/posts/[id]/like — toggle like
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const identifier: string = body.identifier ?? "unknown";

  const db = getAdminSupabase();

  // Check if already liked
  const { data: existing } = await db
    .from("likes")
    .select("id")
    .eq("post_id", id)
    .eq("identifier", identifier)
    .maybeSingle();

  if (existing) {
    // Unlike
    await db.from("likes").delete().eq("id", existing.id);
    await db.rpc("decrement_likes", { post_id: id });
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await db.from("likes").insert({ post_id: id, identifier });
    await db.rpc("increment_likes", { post_id: id });
    return NextResponse.json({ liked: true });
  }
}

// GET /api/posts/[id]/like?identifier=xxx — check if liked
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const identifier = new URL(request.url).searchParams.get("identifier") ?? "";

  const db = getAdminSupabase();
  const { data } = await db
    .from("likes")
    .select("id")
    .eq("post_id", id)
    .eq("identifier", identifier)
    .maybeSingle();

  return NextResponse.json({ liked: !!data });
}
