"use client";

import { useEffect, useState } from "react";

export default function CreateAuthorPage() {
  // ---------------- STATES ----------------

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    royalty: 50,

    bank_account_name: "",
    bank_account_number: "",
    bank_name: "",
    ifsc_code: "",
    upi_id: "",
  });

  const [isEdit, setIsEdit] = useState(false);
  const [authorId, setAuthorId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ---------------- LOAD EDIT DATA ----------------
  // 👇 THIS IS WHAT YOU ASKED ABOUT
  useEffect(() => {
    const data = sessionStorage.getItem("editAuthor");
    if (!data) return;

    const author = JSON.parse(data);

    setForm({
      name: author.name || "",
      email: author.email || "",
      password: "", // never prefill password
      royalty: author.royalty_percentage || 50,

      bank_account_name: author.bank_account_name || "",
      bank_account_number: author.bank_account_number || "",
      bank_name: author.bank_name || "",
      ifsc_code: author.ifsc_code || "",
      upi_id: author.upi_id || "",
    });

    setAuthorId(author.id);
    setIsEdit(true);

    sessionStorage.removeItem("editAuthor");
  }, []);

  // ---------------- SUBMIT HANDLER ----------------

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        isEdit
          ? `/api/admin/authors/${authorId}` // UPDATE
          : "/api/admin/create-author",      // CREATE
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessage(
          isEdit
            ? "Author updated successfully ✅"
            : "Author created successfully 🎉"
        );

        if (!isEdit) {
          setForm({
            name: "",
            email: "",
            password: "",
            royalty: 50,

            bank_account_name: "",
            bank_account_number: "",
            bank_name: "",
            ifsc_code: "",
            upi_id: "",
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-sm border">

        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? "Edit Author" : "Create Author"}
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

        <input
          placeholder="Author Name"
          className="input"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Email"
          className="input"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {!isEdit && (
          <input
            placeholder="Temporary Password"
            className="input"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        )}

        <input
          type="number"
          placeholder="Royalty %"
          className="input"
          value={form.royalty}
          onChange={(e) =>
            setForm({ ...form, royalty: Number(e.target.value) })
          }
        />

        <div className="pt-3 border-t">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Bank Details
          </h2>

          <input
            placeholder="Account Holder Name"
            className="input"
            value={form.bank_account_name}
            onChange={(e) =>
              setForm({ ...form, bank_account_name: e.target.value })
            }
          />

          <input
            placeholder="Account Number"
            className="input"
            value={form.bank_account_number}
            onChange={(e) =>
              setForm({ ...form, bank_account_number: e.target.value })
            }
          />

          <input
            placeholder="Bank Name"
            className="input"
            value={form.bank_name}
            onChange={(e) =>
              setForm({ ...form, bank_name: e.target.value })
            }
          />

          <input
            placeholder="IFSC Code"
            className="input"
            value={form.ifsc_code}
            onChange={(e) =>
              setForm({ ...form, ifsc_code: e.target.value })
            }
          />

          <input
            placeholder="UPI ID (optional)"
            className="input"
            value={form.upi_id}
            onChange={(e) =>
              setForm({ ...form, upi_id: e.target.value })
            }
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-2 text-white font-medium hover:bg-blue-700 transition"
        >
          {loading
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
            ? "Update Author"
            : "Create Author"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          color: #111827;
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
