import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const author_id = searchParams.get("author_id");

  if (!author_id) return NextResponse.json([]);

  const { data } = await supabaseAdmin
    .from("books")
    .select("id, title")
    .eq("author_id", author_id);

  return NextResponse.json(data || []);
}