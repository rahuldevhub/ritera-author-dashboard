import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("authors")
    .select(`
      id,
      name,
      royalty_percentage,
      created_at,
      author_bank_details (
        bank_verified
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const formatted = data.map((a: any) => ({
    id: a.id,
    name: a.name,
    royalty_percentage: a.royalty_percentage,
    bank_verified: a.author_bank_details?.[0]?.bank_verified ?? false,
  }));

  return NextResponse.json(formatted);
}