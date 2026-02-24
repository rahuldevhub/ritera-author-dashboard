import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { encrypt } from "@/app/lib/encryption";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let {
      name,
      email,
      password,
      royalty,
      bank_account_name,
      bank_account_number,
      bank_name,
      ifsc_code,
      upi_id,
    } = body;

    // ---------------- SANITIZE ----------------
    name = name?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();

    // ---------------- VALIDATION ----------------
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (royalty && (royalty < 0 || royalty > 100)) {
      return NextResponse.json(
        { error: "Royalty must be between 0 and 100" },
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
    const authorId = crypto.randomUUID();

    // ---------------- CREATE AUTHOR PROFILE ----------------
    const { error: authorError } = await supabaseAdmin.from("authors").insert({
      id: authorId,
      auth_user_id: authUserId,
      name,
      royalty_percentage: royalty ?? 50,
      created_at: new Date().toISOString(),
    });

    if (authorError) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return NextResponse.json({ error: authorError.message }, { status: 400 });
    }

    // ---------------- INSERT BANK DETAILS ----------------
    const hasBankData =
      bank_account_number?.trim() || upi_id?.trim();

    if (hasBankData) {
      const { error: bankError } = await supabaseAdmin
        .from("author_bank_details")
        .insert({
          author_id: authorId,
          account_name: bank_account_name || null,
          account_number: bank_account_number
            ? encrypt(bank_account_number.trim())
            : null,
          bank_name: bank_name || null,
          ifsc_code: ifsc_code
            ? encrypt(ifsc_code.trim())
            : null,
          upi_id: upi_id
            ? encrypt(upi_id.trim())
            : null,
          bank_verified: false,
          created_at: new Date().toISOString(),
        });

      if (bankError) {
        // Rollback
        await supabaseAdmin.from("authors").delete().eq("id", authorId);
        await supabaseAdmin.auth.admin.deleteUser(authUserId);

        return NextResponse.json(
          { error: bankError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      authorId,
    });

  } catch (err) {
    console.error("CREATE AUTHOR ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}