import { NextRequest, NextResponse } from "next/server";
import { supabase, getAdminSupabase } from "@/lib/supabase";
import { cookies } from "next/headers";

// GET /api/posts?from=0&to=5&type=doc
// type param:
//   omitted / "media" → only video + image + text (excludes docs)
//   "doc"             → only doc posts
//   "all"             → everything
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = parseInt(searchParams.get("from") ?? "0");
  const to   = parseInt(searchParams.get("to")   ?? "9");
  const type = searchParams.get("type") ?? "media";

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (type === "doc") {
    query = query.eq("media_type", "doc");
  } else if (type === "all") {
    // no filter
  } else {
    // default: main media feed — exclude docs
    query = query.neq("media_type", "doc");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/posts — create a new post (admin only)
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, media_url, media_type, doc_filename, doc_size } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const db = getAdminSupabase();
  const { data, error } = await db
    .from("posts")
    .insert({
      title:        title.trim(),
      description:  description?.trim() ?? null,
      media_url:    media_url ?? null,
      media_type:   media_type ?? "text",
      doc_filename: doc_filename ?? null,
      doc_size:     doc_size ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
