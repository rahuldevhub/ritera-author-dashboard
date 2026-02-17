"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type BookStat = {
  id: string;
  title: string;
  cover_url: string | null;
  copies: number;
  amount: number;
};

const MIN_WITHDRAWAL = 2500;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [bookStats, setBookStats] = useState<BookStat[]>([]);
  const [stats, setStats] = useState({
    earnings: 0,
    balance: 0,
    copies: 0,
    books: 0,
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // ✅ Withdraw Handler
  const handleWithdraw = async () => {
    if (!authorId) return;

    setWithdrawing(true);

    const res = await fetch("/api/admin/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId }),
    });

    const data = await res.json();
    setWithdrawing(false);

    if (data.success) {
      alert(
        "Withdrawal initiated. Amount will be credited within 2 business days."
      );
      window.location.reload();
    } else {
      alert(data.error || "Something went wrong");
    }
  };

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

      // 1️⃣ Get author profile
      const { data: author } = await supabase
        .from("authors")
        .select(
          `
          id,
          auth_user_id,
          name,
          bank_account_name,
          bank_account_number,
          bank_name,
          ifsc_code,
          upi_id
        `
        )
        .eq("auth_user_id", userId)
        .single();

      if (!author) {
        setLoading(false);
        return;
      }

      setAuthorId(author.id);
      setAuthorName(author.name);
      setBankDetails(author);

      // ✅ FIXED Wallet Query
      const { data: wallet } = await supabase
        .from("wallet")
        .select("balance")
        .eq("author_id", author.auth_user_id)
        .single();

      // 3️⃣ Books
      const { data: books } = await supabase
        .from("books")
        .select("id, title, cover_url")
        .eq("author_id", author.id)
        .order("created_at", { ascending: false });

      let totalCopies = 0;
      let totalAmount = 0;

      const bookData: BookStat[] = await Promise.all(
        (books || []).map(async (book) => {
          const { data: sales } = await supabase
            .from("sales")
            .select("copies, amount")
            .eq("book_id", book.id);

          const copies = sales?.reduce((sum, s) => sum + s.copies, 0) || 0;
          const amount = sales?.reduce((sum, s) => sum + s.amount, 0) || 0;

          totalCopies += copies;
          totalAmount += amount;

          return {
            id: book.id,
            title: book.title,
            cover_url: book.cover_url ?? null,
            copies,
            amount,
          };
        })
      );

      setBookStats(bookData);

      setStats({
        earnings: totalAmount,
        balance: wallet?.balance ?? 0,
        copies: totalCopies,
        books: books?.length || 0,
      });

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 relative">
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

          <WalletCard
            balance={stats.balance}
            onWithdraw={() => setShowWithdrawModal(true)}
          />

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
            <p className="text-sm text-gray-500">No books available yet.</p>
          ) : (
            <div className="space-y-4">
              {bookStats.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={book.cover_url || "/file.svg"}
                      alt={book.title}
                      className="h-16 w-12 rounded-md object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-500">
                        Copies Sold: {book.copies}
                      </p>
                    </div>
                  </div>

                  <p className="font-semibold text-gray-900">₹ {book.amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showWithdrawModal && (
        <WithdrawModal
          bankDetails={bankDetails}
          withdrawing={withdrawing}
          onProceed={handleWithdraw}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  );
}

/* ---------- Components ---------- */

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function WalletCard({
  balance,
  onWithdraw,
}: {
  balance: number;
  onWithdraw: () => void;
}) {
  const canWithdraw = balance >= MIN_WITHDRAWAL;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500">Wallet Balance</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">₹ {balance}</p>

      <button
        disabled={!canWithdraw}
        onClick={onWithdraw}
        className={`mt-4 w-full rounded-lg px-4 py-2 text-sm text-white transition 
        ${
          canWithdraw
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Withdrawal
      </button>

      {!canWithdraw && (
        <p className="text-xs text-gray-500 mt-2">
          Minimum ₹{MIN_WITHDRAWAL} required to withdraw
        </p>
      )}
    </div>
  );
}

function WithdrawModal({
  bankDetails,
  withdrawing,
  onProceed,
  onClose,
}: {
  bankDetails: any;
  withdrawing: boolean;
  onProceed: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Withdrawal Details
        </h2>

        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Account Holder:</strong> {bankDetails?.bank_account_name}
          </p>
          <p>
            <strong>Account Number:</strong> {bankDetails?.bank_account_number}
          </p>
          <p>
            <strong>Bank Name:</strong> {bankDetails?.bank_name}
          </p>
          <p>
            <strong>IFSC Code:</strong> {bankDetails?.ifsc_code}
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Your amount will be credited within 2 business days.
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 rounded-lg bg-gray-200 text-sm"
          >
            Close
          </button>

          <button
            onClick={onProceed}
            disabled={withdrawing}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
          >
            {withdrawing ? "Processing..." : "Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
}
