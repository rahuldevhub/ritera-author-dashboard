import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const authorId = searchParams.get("author_id");

  if (!authorId) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabaseAdmin
    .from("books")
    .select("id, title")
    .eq("author_id", authorId)
    .order("title");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}
