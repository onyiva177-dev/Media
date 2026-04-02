import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

// POST /api/posts/[id]/view
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const identifier: string =
    body.identifier ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const db = getAdminSupabase();

  // Check if this identifier already viewed this post
  const { data: existing } = await db
    .from("views")
    .select("id")
    .eq("post_id", id)
    .eq("identifier", identifier)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ counted: false });
  }

  // Record the view
  await db.from("views").insert({ post_id: id, identifier });

  // Increment views count on the post
  await db.rpc("increment_views", { post_id: id });

  return NextResponse.json({ counted: true });
}
