"use client";

import { useEffect, useState } from "react";

type Author = { id: string; name: string };
type Book = { id: string; title: string };

export default function AddSalePage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [authorId, setAuthorId] = useState("");
  const [bookId, setBookId] = useState("");
  const [copies, setCopies] = useState(0);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load authors
  useEffect(() => {
    fetch("/api/admin/get-authors")
      .then((res) => res.json())
      .then(setAuthors);
  }, []);

  // Load books when author changes
  useEffect(() => {
    if (!authorId) {
      setBooks([]);
      setBookId("");
      return;
    }

    fetch(`/api/admin/get-books?author_id=${authorId}`)
      .then((res) => res.json())
      .then(setBooks);
  }, [authorId]);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/create-sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book_id: bookId,
        copies,
        amount,
      }),
    });

    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setMessage("Sales added successfully 💰");
      setCopies(0);
      setAmount(0);
      setBookId("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-sm border">
        <h1 className="text-xl font-semibold text-gray-900">Add Sales</h1>

        {message && (
          <p className="text-sm text-green-700 bg-green-100 p-2 rounded">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-700 bg-red-100 p-2 rounded">{error}</p>
        )}

        <select
          className="w-full rounded-lg border p-2 bg-white text-gray-900 disabled:bg-white disabled:text-gray-900 disabled:opacity-100"
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
        >
          <option value="">Select Author</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded-lg border p-2 bg-white text-gray-900 disabled:bg-white disabled:text-gray-900 disabled:opacity-100"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          disabled={!authorId || books.length === 0}
        >
          <option value="">
            {books.length ? "Select Book" : "No books found"}
          </option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>

        <div className="space-y-1">
          <p className="text-sm text-gray-500">Copies Sold</p>
          <input
            // type="number"
            placeholder="Copies Sold"
            className="w-full rounded-lg border p-2 bg-white text-gray-900 disabled:bg-white disabled:text-gray-900 disabled:opacity-100"
            value={copies}
            onChange={(e) => setCopies(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Amount Earned</p>
          <input
            // type="number"
            placeholder="Amount Earned"
            className="w-full rounded-lg border p-2 bg-white text-gray-900 disabled:bg-white disabled:text-gray-900 disabled:opacity-100"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !bookId}
          className="w-full rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Add Sales"}
        </button>
      </div>
    </div>
  );
}
