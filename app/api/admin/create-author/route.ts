import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      password,
      royalty,

      // Bank details
      bank_account_name,
      bank_account_number,
      bank_name,
      ifsc_code,
      upi_id,
    } = body;

    // ---------------- VALIDATION ----------------
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------------- CREATE AUTH USER ----------------
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: authError?.message || "Auth creation failed" },
        { status: 400 }
      );
    }

    const authUserId = authData.user.id;

    // ---------------- CREATE AUTHOR PROFILE ----------------
    const { error: dbError } = await supabaseAdmin
      .from("authors")
      .insert({
        id: crypto.randomUUID(),       // independent profile ID
        auth_user_id: authUserId,      // FK → auth.users.id
        name,
        royalty_percentage: royalty ?? 50,

        bank_account_name: bank_account_name || null,
        bank_account_number: bank_account_number || null,
        bank_name: bank_name || null,
        ifsc_code: ifsc_code || null,
        upi_id: upi_id || null,

        bank_verified: false,
      });

    // ---------------- ROLLBACK ON FAILURE ----------------
    if (dbError) {
      // 🔥 IMPORTANT: clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authUserId);

      return NextResponse.json(
        { error: dbError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CREATE AUTHOR ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
