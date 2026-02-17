import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("authors")
    .select("id, name")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data || []);
}
