import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const {
      author_id,
      title,
      cover_url, // 👈 optional
    } = await req.json();

    // ---------------- VALIDATION ----------------
    if (!author_id || !title) {
      return NextResponse.json(
        { error: "Author and title are required" },
        { status: 400 }
      );
    }

    // ---------------- INSERT BOOK ----------------
    const { error } = await supabaseAdmin
      .from("books")
      .insert({
        id: crypto.randomUUID(),   // primary key
        author_id,                // authors.id
        title,
        cover_url: cover_url || null, // 👈 safe default
      });

    if (error) {
      console.error("CREATE BOOK ERROR:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CREATE BOOK API ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
