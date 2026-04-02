import { NextRequest, NextResponse } from "next/server";
import { supabase, getAdminSupabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

// GET /api/posts/[id]/comments
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/posts/[id]/comments — add a comment (no auth required)
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const content: string = (body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  if (content.length > 500) {
    return NextResponse.json({ error: "Comment too long (max 500 chars)" }, { status: 400 });
  }

  const db = getAdminSupabase();
  const { data, error } = await db
    .from("comments")
    .insert({ post_id: id, content })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
