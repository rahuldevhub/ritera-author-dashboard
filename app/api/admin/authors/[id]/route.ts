import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // 1️⃣ get auth user id
  const { data: author } = await supabase
    .from("authors")
    .select("auth_user_id")
    .eq("id", id)
    .single();

  if (!author?.auth_user_id) {
    return NextResponse.json(
      { error: "Auth user not linked" },
      { status: 400 }
    );
  }

  // 2️⃣ delete author profile
  await supabase.from("authors").delete().eq("id", id);

  // 3️⃣ delete auth user
  await supabase.auth.admin.deleteUser(author.auth_user_id);

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  const { error } = await supabase
    .from("authors")
    .update(body)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
