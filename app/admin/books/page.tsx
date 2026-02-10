"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Author = {
  id: string;
  name: string;
};

export default function AddBookPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [authorId, setAuthorId] = useState("");
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/get-authors")
      .then((res) => res.json())
      .then((data) => setAuthors(data));
  }, []);

  const handleSubmit = async () => {
    if (!authorId || !title) {
      setError("Author and title are required");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      let coverUrl: string | null = null;

      // 1️⃣ Upload cover image (if selected)
      if (cover) {
        const fileName = `${Date.now()}-${cover.name}`;

        const { error: uploadError } = await supabase.storage
          .from("book-covers")
          .upload(fileName, cover);

        if (uploadError) {
          setError("Cover upload failed");
          setLoading(false);
          return;
        }

        coverUrl = supabase.storage.from("book-covers").getPublicUrl(fileName)
          .data.publicUrl;
      }

      // 2️⃣ Create book
      const res = await fetch("/api/admin/create-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_id: authorId,
          title,
          cover_url: coverUrl,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessage("Book added successfully 📘");
        setTitle("");
        setCover(null);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-sm border">
        <h1 className="text-xl font-semibold text-gray-900">Add Book</h1>

        {message && (
          <p className="text-sm text-green-700 bg-green-100 p-2 rounded">
            {message}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-100 p-2 rounded">{error}</p>
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
          className="w-full rounded-lg border border-gray-300 p-2 text-gray-900"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="space-y-1">
          <p className="text-sm text-gray-500">Cover Image</p>
          <input
            type="file"
            accept="image/*"
            className="w-full rounded-lg border border-gray-300 p-2 text-gray-600"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-2 text-white font-medium hover:bg-blue-700 transition"
        >
          {loading ? "Adding..." : "Add Book"}
        </button>
      </div>
    </div>
  );
}
