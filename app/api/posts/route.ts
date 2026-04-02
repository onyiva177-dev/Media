import { NextRequest, NextResponse } from "next/server";
import { supabase, getAdminSupabase } from "@/lib/supabase";
import { cookies } from "next/headers";

// GET /api/posts?from=0&to=5
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = parseInt(searchParams.get("from") ?? "0");
  const to = parseInt(searchParams.get("to") ?? "9");

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

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
  const { title, description, media_url, media_type } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const db = getAdminSupabase();
  const { data, error } = await db
    .from("posts")
    .insert({
      title: title.trim(),
      description: description?.trim() ?? null,
      media_url: media_url ?? null,
      media_type: media_type ?? "text",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
