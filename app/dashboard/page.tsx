"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type BookStat = {
  id: string;
  title: string;
  copies: number;
  amount: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [bookStats, setBookStats] = useState<BookStat[]>([]);
  const [stats, setStats] = useState({
    earnings: 0,
    balance: 0,
    copies: 0,
    books: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const userId = session.user.id;

      // Author
      const { data: author } = await supabase
        .from("authors")
        .select("name")
        .eq("id", userId)
        .single();

      setAuthorName(author?.name || "");

      // Wallet
      const { data: wallet } = await supabase
        .from("wallet")
        .select("balance")
        .eq("author_id", userId)
        .single();

      // Books
      const { data: books } = await supabase
        .from("books")
        .select("id, title")
        .eq("author_id", userId);

      let totalCopies = 0;
      let totalAmount = 0;

      const bookData: BookStat[] =
        (await Promise.all(
          books?.map(async (book) => {
            const { data: sales } = await supabase
              .from("sales")
              .select("copies, amount")
              .eq("book_id", book.id);

            const copies =
              sales?.reduce((a, b) => a + b.copies, 0) || 0;
            const amount =
              sales?.reduce((a, b) => a + b.amount, 0) || 0;

            totalCopies += copies;
            totalAmount += amount;

            return {
              id: book.id,
              title: book.title,
              copies,
              amount,
            };
          }) || []
        )) as BookStat[];

      setBookStats(bookData);

      setStats({
        earnings: totalAmount,
        balance: wallet?.balance || 0,
        copies: totalCopies,
        books: books?.length || 0,
      });

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, {authorName}
            </h1>
            <p className="text-sm text-gray-500">
              Here’s a summary of your publishing performance
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Lifetime Earnings" value={`₹ ${stats.earnings}`} />
          <StatCard title="Wallet Balance" value={`₹ ${stats.balance}`} />
          <StatCard title="Copies Sold" value={stats.copies} />
          <StatCard title="Books Published" value={stats.books} />
        </div>

        {/* Books */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Your Books
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Sales and earnings by book
          </p>

          {bookStats.length === 0 ? (
            <p className="text-sm text-gray-500">
              No books available yet.
            </p>
          ) : (
            <div className="space-y-4">
              {bookStats.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {/* Book Cover Placeholder */}
                    <div className="h-16 w-12 rounded-md bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      Cover
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {book.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Copies Sold: {book.copies}
                      </p>
                    </div>
                  </div>

                  <p className="font-semibold text-gray-900">
                    ₹ {book.amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}
