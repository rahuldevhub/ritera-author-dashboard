"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import AuthorsList from "./components/AuthorsList";

const ADMIN_EMAILS = ["riterapublishing@gmail.com"];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Not logged in
      if (!session) {
        window.location.href = "/login";
        return;
      }

      // Logged in but not admin
      if (!ADMIN_EMAILS.includes(session.user.email || "")) {
        alert("Unauthorized access");
        window.location.href = "/dashboard";
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, []);
  

  if (loading) {
    return (
      <p className="p-6 text-gray-600">
        Checking admin access...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Manage authors, books, sales, and wallets
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <AdminCard
            title="Create Author"
            description="Add a new author and generate login access"
            href="/admin/authors"
          />

          <AdminCard
            title="Add Book"
            description="Assign books to authors"
            href="/admin/books"
          />

          <AdminCard
            title="Add Sales"
            description="Update book sales and royalties"
            href="/admin/sales"
          />

          {/* <AdminCard
            title="Wallet Overview"
            description="View author wallet balances"
            href="#"
            disabled
          />

          <AdminCard
            title="Reports"
            description="Download sales and earnings reports"
            href="#"
            disabled
          /> */}
        </div>

        {/* Authors List */}
        <AuthorsList />

      </div>
    </div>
  );
}

/* ---------- Reusable Card Component ---------- */

function AdminCard({
  title,
  description,
  href,
  disabled = false,
}: {
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  const card = (
    <div
      className={`rounded-xl border bg-white p-6 shadow-sm transition ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-blue-500 hover:shadow-md"
      }`}
    >
      <h3 className="text-lg font-medium text-gray-900">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        {description}
      </p>
    </div>
  );

  if (disabled) return card;

  return <Link href={href}>{card}</Link>;
}