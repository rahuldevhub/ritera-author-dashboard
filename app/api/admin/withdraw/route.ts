import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT
);

export async function POST(req: Request) {
  try {
    const { authorId } = await req.json();

    // 1️⃣ Get Author
    const { data: author } = await supabase
      .from("authors")
      .select("*")
      .eq("id", authorId)
      .single();

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    // 2️⃣ Get Wallet
    const { data: wallet } = await supabase
      .from("wallet")
      .select("*")
      .eq("author_id", author.auth_user_id)
      .single();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const amount = wallet.balance;

    if (!amount || amount < 2500) {
      return NextResponse.json(
        { error: "Minimum withdrawal is ₹2500" },
        { status: 400 }
      );
    }

    // 3️⃣ Insert Withdrawal Record
    await supabase.from("withdrawals").insert({
      author_id: author.id,
      amount,
      status: "pending",
    });

    // 4️⃣ Update Wallet (set balance 0 and increase paid)
    await supabase
      .from("wallet")
      .update({
        balance: 0,
        paid: wallet.paid + amount,
      })
      .eq("author_id", author.auth_user_id);

    // 5️⃣ Send Mail (non-blocking safe version)
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: "riterapublishing@gmail.com",
        subject: `New Withdrawal Request – ${author.name}`,
        text: `Withdrawal request of ₹${amount} from ${author.name}`,
      });

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: author.email,
        subject: "Your Withdrawal Has Been Initiated",
        text: `Hi ${author.name}, your withdrawal of ₹${amount} is initiated.`,
      });
    } catch (mailError) {
      console.error("Mail failed:", mailError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Withdraw Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

