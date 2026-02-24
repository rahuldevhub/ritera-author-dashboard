import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/app/lib/encryption";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { authorId } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("author_bank_details")
    .select("*")
    .eq("author_id", authorId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Bank details not found" }, { status: 400 });
  }

  const decryptedAccount = data.account_number
    ? decrypt(data.account_number)
    : null;

  const decryptedIfsc = data.ifsc_code
    ? decrypt(data.ifsc_code)
    : null;

  const maskedAccount = decryptedAccount
    ? "XXXXXX" + decryptedAccount.slice(-4)
    : null;

  return NextResponse.json({
    bank_account_name: data.account_name,
    bank_account_number: maskedAccount, // masked
    bank_name: data.bank_name,
    ifsc_code: decryptedIfsc, // original IFSC
    upi_id: data.upi_id,
  });
}