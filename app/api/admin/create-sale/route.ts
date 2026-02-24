import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { book_id, copies, amount } = await req.json();

    if (!book_id || copies <= 0 || amount <= 0) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // 1️⃣ Get book → author
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("author_id")
      .eq("id", book_id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 400 });
    }

    const authorId = book.author_id;

    // 2️⃣ Get author royalty %
    const { data: author, error: authorError } = await supabaseAdmin
      .from("authors")
      .select("royalty_percentage")
      .eq("id", authorId)
      .single();

    if (authorError || !author) {
      return NextResponse.json({ error: "Author not found" }, { status: 400 });
    }

    const royaltyPercentage = author.royalty_percentage ?? 50;
    const royaltyAmount = (amount * royaltyPercentage) / 100;

    // 3️⃣ Insert sale
    const { error: saleError } = await supabaseAdmin
      .from("sales")
      .insert({ book_id, copies, amount });

    if (saleError) {
      return NextResponse.json({ error: saleError.message }, { status: 400 });
    }

    // 4️⃣ Get wallet row
    const { data: wallet } = await supabaseAdmin
      .from("wallet")
      .select("total_earned, paid, balance")
      .eq("author_id", authorId)
      .maybeSingle();

    if (wallet) {
      // ✅ Update existing wallet
      const newTotalEarned = (wallet.total_earned ?? 0) + royaltyAmount;
      const newBalance = (wallet.balance ?? 0) + royaltyAmount;

      const { error: updateError } = await supabaseAdmin
        .from("wallet")
        .update({
          total_earned: newTotalEarned,
          balance: newBalance,
        })
        .eq("author_id", authorId);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 },
        );
      }
    } else {
      // ✅ Create new wallet row
      const { error: insertError } = await supabaseAdmin
        .from("wallet")
        .insert({
          author_id: authorId,
          total_earned: royaltyAmount,
          paid: 0,
          balance: royaltyAmount,
        });

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      royaltyAdded: royaltyAmount,
    });
  } catch (err) {
    console.error("CREATE SALE ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}