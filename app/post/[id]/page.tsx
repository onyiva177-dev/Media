import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SinglePostClient from "./SinglePostClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("posts")
    .select("title, description")
    .eq("id", id)
    .single();

  if (!data) return { title: "Post Not Found" };

  return {
    title: data.title,
    description: data.description ?? undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) notFound();

  return <SinglePostClient post={post} />;
}
