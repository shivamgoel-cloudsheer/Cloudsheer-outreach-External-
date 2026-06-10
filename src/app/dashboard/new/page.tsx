"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { renderTemplate } from "@/lib/template";

type Preview = {
  sheetId: string;
  headers: string[];
  emailColumn: string | null;
  totalRows: number;
  sampleRows: Record<string, string>[];
};

export default function NewCampaignPage() {
  const router = useRouter();

  const [sheetUrl, setSheetUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewRow = preview?.sampleRows[0];
  const renderedSubject = useMemo(
    () => (previewRow ? renderTemplate(subject, previewRow) : ""),
    [subject, previewRow]
  );
  const renderedBody = useMemo(
    () => (previewRow ? renderTemplate(body, previewRow) : ""),
    [body, previewRow]
  );

  async function loadSheet() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sheets/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load sheet");
      setPreview(data);

      // Prefill from common column names
      const headers: string[] = data.headers;
      const subjectCol = headers.find((h) =>
        h.toLowerCase().includes("subject")
      );
      const contentCol = headers.find(
        (h) =>
          h.toLowerCase().includes("content") ||
          h.toLowerCase().includes("body") ||
          h.toLowerCase().includes("message")
      );
      if (subjectCol && !subject) setSubject(`{{${subjectCol}}}`);
      if (contentCol && !body) setBody(`{{${contentCol}}}`);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Failed to load sheet");
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sheetUrl,
          subjectTemplate: subject,
          bodyTemplate: body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create campaign");
      router.push(`/dashboard/campaigns/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create campaign");
      setCreating(false);
    }
  }

  function insertPlaceholder(header: string) {
    setBody((prev) => `${prev}{{${header}}}`);
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-sky-500";

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">New campaign</h1>

      {/* Step 1: sheet */}
      <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium text-neutral-300">
          1. Connect your Google Sheet
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Row 1 must be headers. An Email column is required; every other
          column becomes a placeholder.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            className={inputClass}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
          />
          <button
            onClick={loadSheet}
            disabled={loading || !sheetUrl.trim()}
            className="shrink-0 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:opacity-40"
          >
            {loading ? "Loading..." : preview ? "Reload" : "Load sheet"}
          </button>
        </div>

        {preview && (
          <div className="mt-5">
            <p className="text-xs text-neutral-400">
              {preview.totalRows} rows ·{" "}
              {preview.emailColumn ? (
                <>
                  email column:{" "}
                  <span className="text-emerald-400">
                    {preview.emailColumn}
                  </span>
                </>
              ) : (
                <span className="text-red-400">
                  no email column found - add one named Email
                </span>
              )}
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-800/60 text-neutral-400">
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, i) => (
                    <tr key={i} className="border-t border-neutral-800">
                      {preview.headers.map((h) => (
                        <td
                          key={h}
                          className="max-w-50 truncate px-3 py-2 text-neutral-300"
                        >
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Step 2: compose */}
      {preview && (
        <section className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-medium text-neutral-300">2. Compose</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-neutral-400">
                Campaign name (internal)
              </label>
              <input
                className={inputClass}
                placeholder="June partner outreach"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-400">
                Subject
              </label>
              <input
                className={inputClass}
                placeholder="Quick question, {{Name}}"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-400">
                Body
              </label>
              <textarea
                className={`${inputClass} min-h-44 font-mono`}
                placeholder={"Hi {{Name}},\n\n..."}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preview.headers.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => insertPlaceholder(h)}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 transition hover:border-sky-500 hover:text-sky-400"
                  >
                    {`{{${h}}}`}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                An unsubscribe link is appended to every email automatically.
              </p>
            </div>
          </div>

          {previewRow && (subject || body) && (
            <div className="mt-5 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Preview (row 1: {previewRow[preview.emailColumn ?? ""] ?? ""})
              </p>
              <p className="mt-2 text-sm font-medium text-neutral-200">
                {renderedSubject || "(no subject)"}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap text-neutral-400">
                {renderedBody || "(empty body)"}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Step 3: create */}
      {preview && (
        <div className="mt-4 flex items-center justify-between">
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <span />
          )}
          <button
            onClick={createCampaign}
            disabled={
              creating ||
              !name.trim() ||
              !subject.trim() ||
              !body.trim() ||
              !preview.emailColumn
            }
            className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:opacity-40"
          >
            {creating
              ? "Creating..."
              : `Create draft (${preview.totalRows} recipients)`}
          </button>
        </div>
      )}

      {!preview && error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
