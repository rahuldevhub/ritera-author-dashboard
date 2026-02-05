"use client";

import { useEffect, useState } from "react";

type Author = {
  id: string;
  name: string;
  royalty_percentage: number;
  bank_verified: boolean;
};

export default function AuthorsList() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/authors")
      .then((res) => res.json())
      .then((data) => {
        setAuthors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (author: Author) => {
    const ok = confirm(
      `Are you sure you want to delete "${author.name}"?`
    );
    if (!ok) return;

    await fetch(`/api/admin/authors/${author.id}`, {
      method: "DELETE",
    });

    // Remove from UI without reload
    setAuthors((prev) =>
      prev.filter((a) => a.id !== author.id)
    );
  };

  const handleEdit = (author: any) => {
  sessionStorage.setItem(
    "editAuthor",
    JSON.stringify(author)
  );
  window.location.href = "/admin/authors";
};

  if (loading) {
    return (
      <p className="text-sm text-gray-700 font-medium">
        Loading authors...
      </p>
    );
  }

  if (!authors.length) {
    return (
      <p className="text-sm text-gray-700 font-medium">
        No authors found.
      </p>
    );
  }

  return (
    <div className="mt-10 bg-white rounded-xl border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Authors
      </h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-700 border-b">
            <th className="py-2">Name</th>
            <th>Royalty</th>
            <th>Bank</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {authors.map((a) => (
            <tr
              key={a.id}
              className="border-b last:border-b-0"
            >
              <td className="py-3 font-medium text-gray-900">
                {a.name}
              </td>

              <td className="text-gray-800">
                {a.royalty_percentage}%
              </td>

              <td className="text-gray-800">
                {a.bank_verified ? (
                  <span className="text-green-600 font-medium">
                    Verified
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    Not added
                  </span>
                )}
              </td>

              <td className="text-right space-x-4">
                <button
                  onClick={() => handleEdit(a)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(a)}
                  className="text-red-600 hover:underline font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
