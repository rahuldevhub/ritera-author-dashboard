"use client";

import { useEffect, useState } from "react";

type Author = {
  id: string;
  name: string;
};

export default function AddBookPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [authorId, setAuthorId] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/get-authors")
      .then((res) => res.json())
      .then((data) => setAuthors(data));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/create-book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_id: authorId, title }),
    });

    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setMessage("Book added successfully 📘");
      setTitle("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-sm border">

        <h1 className="text-xl font-semibold text-gray-900">
          Add Book
        </h1>

        {message && (
          <p className="text-sm text-green-700 bg-green-100 p-2 rounded">
            {message}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-100 p-2 rounded">
            {error}
          </p>
        )}

        <select
          className="w-full rounded-lg border border-gray-300 p-2 text-gray-900"
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

        <input
          placeholder="Book Title"
          className="w-full rounded-lg border border-gray-300 p-2
                     text-gray-900 placeholder-gray-600"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !authorId}
          className="w-full rounded-lg bg-blue-600 p-2
                     text-white font-medium hover:bg-blue-700 transition"
        >
          {loading ? "Adding..." : "Add Book"}
        </button>
      </div>
    </div>
  );
}