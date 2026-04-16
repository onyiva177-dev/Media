import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DocDetailClient from "./DocDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("posts")
    .select("title, description, doc_filename")
    .eq("id", id)
    .single();
  if (!data) return { title: "Document Not Found" };
  return {
    title: data.title,
    description: data.description ?? `Download: ${data.doc_filename ?? data.title}`,
  };
}

export default async function DocDetailPage({ params }: Props) {
  const { id } = await params;
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !post || post.media_type !== "doc") notFound();
  return <DocDetailClient post={post} />;
}
