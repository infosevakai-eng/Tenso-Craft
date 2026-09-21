import { useEffect, useRef, useState } from "react";
import { exportImportJson, getImportContext, runImport } from "../../lib/firestore";
import { parseImportFile, summarizeImport } from "../../lib/importParser";

const PREVIEW_ROW_LIMIT = 50;
const LIST_LIMIT = 30;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0b1c2c] focus:ring-2 focus:ring-[#0b1c2c]/10";

const fileInputClass =
  "block w-full text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#0b1c2c] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#12304a] disabled:opacity-60";

const primaryButtonClass =
  "rounded-lg bg-[#d9a441] px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#c8942f] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename, data) {
  downloadText(filename, JSON.stringify(data, null, 2), "application/json");
}

function Card({ title, hint, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CountBadge({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {value} {label}
    </span>
  );
}

function MessageList({ items, tone }) {
  const shown = items.slice(0, LIST_LIMIT);
  const remaining = items.length - shown.length;
  const toneClass = tone === "error" ? "text-red-700" : "text-amber-700";
  return (
    <ul className={`space-y-1 text-sm ${toneClass}`}>
      {shown.map((msg, i) => (
        <li key={i} className="leading-snug">
          • {msg}
        </li>
      ))}
      {remaining > 0 && <li className="text-slate-500">…and {remaining} more.</li>}
    </ul>
  );
}

export default function AdminImport() {
  const [context, setContext] = useState(null);
  const [contextError, setContextError] = useState("");

  const [rawText, setRawText] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseAttempted, setParseAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("categories");

  const [mode, setMode] = useState("create");
  const [importing, setImporting] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [importError, setImportError] = useState("");
  const [result, setResult] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const fileInputRef = useRef(null);

  const loadContext = async () => {
    setContextError("");
    try {
      const ctx = await getImportContext();
      setContext(ctx);
      return ctx;
    } catch (err) {
      console.error(err);
      setContextError(err?.message || "Could not load existing categories/products from Firestore.");
      return null;
    }
  };

  useEffect(() => {
    loadContext();
  }, []);

  const runParse = (text, ctx) => {
    if (!ctx) return;
    const outcome = parseImportFile(text, ctx);
    setParsed(outcome);
    setParseAttempted(true);
    setResult(null);
    setImportError("");
    setActiveTab(outcome.categories.length > 0 ? "categories" : "products");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileLabel(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setRawText(text);
      runParse(text, context);
    };
    reader.onerror = () => {
      setParsed({ categories: [], products: [], errors: ["Could not read that file."], warnings: [] });
      setParseAttempted(true);
    };
    reader.readAsText(file);
  };

  const handleValidateClick = () => runParse(rawText, context);

  const handleReset = () => {
    setRawText("");
    setFileLabel("");
    setParsed(null);
    setParseAttempted(false);
    setResult(null);
    setImportError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!parsed || parsed.errors.length > 0) return;
    setImporting(true);
    setImportError("");
    setResult(null);
    setProgressText("Writing categories and products to Firestore…");

    try {
      const outcome = await runImport(parsed, mode);
      setResult(outcome);
      // Refresh existing-slug context so a second import (or a re-run of the
      // same file) correctly classifies what just got created as "existing".
      const ctx = await loadContext();
      if (ctx && rawText) runParse(rawText, ctx);
    } catch (err) {
      console.error(err);
      setImportError(err?.message || "Import failed.");
    } finally {
      setImporting(false);
      setProgressText("");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError("");
    try {
      const data = await exportImportJson();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(`tenso-craft-export-${stamp}.json`, data);
    } catch (err) {
      console.error(err);
      setExportError(err?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadIssues = () => {
    if (!parsed) return;
    const lines = [
      `Errors (${parsed.errors.length}):`,
      ...parsed.errors.map((m) => `- ${m}`),
      "",
      `Warnings (${parsed.warnings.length}):`,
      ...parsed.warnings.map((m) => `- ${m}`),
    ];
    downloadText("import-issues.txt", lines.join("\n"));
  };

  const hasBlockingErrors = Boolean(parsed && parsed.errors.length > 0);
  const canImport = Boolean(
    parsed &&
      !hasBlockingErrors &&
      (parsed.categories.length > 0 || parsed.products.length > 0) &&
      context &&
      !importing
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Import</h1>
          <p className="mt-1 text-sm text-slate-500">
            Bulk-load categories and products from a JSON file. Imported products are always saved as{" "}
            <span className="font-medium text-slate-700">Draft</span> — add images later from the Solutions tab.
          </p>
        </div>
        <button type="button" onClick={handleExport} disabled={exporting} className={secondaryButtonClass}>
          {exporting ? "Exporting…" : "Export current data (JSON)"}
        </button>
      </div>
      {exportError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {exportError}
        </p>
      )}

      {contextError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {contextError}{" "}
          <button type="button" onClick={loadContext} className="font-semibold underline">
            Retry
          </button>
        </p>
      )}

      <Card
        title="1. Choose a file"
        hint='JSON with "categories" and "products" arrays. See the Phase 13 format in the project plan.'
      >
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            disabled={!context || importing}
            className={fileInputClass}
          />
          {fileLabel && <p className="text-xs text-slate-500">Loaded: {fileLabel}</p>}

          <details>
            <summary className="cursor-pointer text-sm font-medium text-slate-600">
              Or paste JSON directly
            </summary>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder='{ "categories": [...], "products": [...] }'
              className={`${inputClass} mt-2 font-mono text-xs`}
            />
          </details>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleValidateClick}
              disabled={!context || !rawText.trim() || importing}
              className={primaryButtonClass}
            >
              Validate &amp; preview
            </button>
            {parseAttempted && (
              <button type="button" onClick={handleReset} disabled={importing} className={secondaryButtonClass}>
                Start over
              </button>
            )}
          </div>
        </div>
      </Card>

      {parsed && (
        <Card title="2. Preview">
          <div className="space-y-4">
            <p className="text-sm text-slate-700">{summarizeImport(parsed)}</p>

            <div className="flex flex-wrap gap-2">
              <CountBadge label="errors" value={parsed.errors.length} tone={parsed.errors.length ? "red" : "slate"} />
              <CountBadge
                label="warnings"
                value={parsed.warnings.length}
                tone={parsed.warnings.length ? "amber" : "slate"}
              />
              {(parsed.errors.length > 0 || parsed.warnings.length > 0) && (
                <button
                  type="button"
                  onClick={handleDownloadIssues}
                  className="text-xs font-semibold text-slate-600 underline"
                >
                  Download issue list
                </button>
              )}
            </div>

            {hasBlockingErrors && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="mb-2 text-sm font-semibold text-red-800">
                  Fix these before importing — nothing will be written while errors remain.
                </p>
                <MessageList items={parsed.errors} tone="error" />
              </div>
            )}

            {parsed.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="mb-2 text-sm font-semibold text-amber-800">
                  Warnings — these rows still import.
                </p>
                <MessageList items={parsed.warnings} tone="warning" />
              </div>
            )}

            <div className="border-b border-slate-200">
              <nav className="-mb-px flex gap-6">
                {["categories", "products"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 py-2 text-sm font-medium capitalize ${
                      activeTab === tab
                        ? "border-[#d9a441] text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab} ({parsed[tab].length})
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === "categories" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Slug</th>
                      <th className="py-2 pr-4">Order</th>
                      <th className="py-2 pr-4">Home</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.categories.slice(0, PREVIEW_ROW_LIMIT).map((c) => (
                      <tr key={c.slug}>
                        <td className="py-2 pr-4 font-medium text-slate-800">{c.name}</td>
                        <td className="py-2 pr-4 text-slate-500">{c.slug}</td>
                        <td className="py-2 pr-4 text-slate-500">{c.order ?? "—"}</td>
                        <td className="py-2 pr-4 text-slate-500">{c.showOnHome ? "Yes" : "—"}</td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              c.existsInFirestore ? "bg-slate-100 text-slate-600" : "bg-green-50 text-green-700"
                            }`}
                          >
                            {c.existsInFirestore ? "Existing" : "New"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.categories.length > PREVIEW_ROW_LIMIT && (
                  <p className="mt-2 text-xs text-slate-500">
                    Showing first {PREVIEW_ROW_LIMIT} of {parsed.categories.length}.
                  </p>
                )}
                {parsed.categories.length === 0 && <p className="text-sm text-slate-500">No categories in this file.</p>}
              </div>
            )}

            {activeTab === "products" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Specs</th>
                      <th className="py-2 pr-4">Price</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.products.slice(0, PREVIEW_ROW_LIMIT).map((p) => (
                      <tr key={p.slug}>
                        <td className="py-2 pr-4 font-medium text-slate-800">{p.title}</td>
                        <td className="py-2 pr-4 text-slate-500">{p.category}</td>
                        <td className="py-2 pr-4 text-slate-500">{p.specs?.length || 0}</td>
                        <td className="py-2 pr-4 text-slate-500">
                          {p.priceValue != null ? `₹${p.priceValue}${p.priceUnit ? ` / ${p.priceUnit}` : ""}` : "—"}
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              p.existsInFirestore ? "bg-slate-100 text-slate-600" : "bg-green-50 text-green-700"
                            }`}
                          >
                            {p.existsInFirestore ? "Existing" : "New"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.products.length > PREVIEW_ROW_LIMIT && (
                  <p className="mt-2 text-xs text-slate-500">
                    Showing first {PREVIEW_ROW_LIMIT} of {parsed.products.length}.
                  </p>
                )}
                {parsed.products.length === 0 && <p className="text-sm text-slate-500">No products in this file.</p>}
              </div>
            )}
          </div>
        </Card>
      )}

      {parsed && !hasBlockingErrors && (parsed.categories.length > 0 || parsed.products.length > 0) && (
        <Card title="3. Import">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "create"}
                  onChange={() => setMode("create")}
                  disabled={importing}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="font-medium text-slate-800">Create new only</span>
                  <span className="block text-slate-500">
                    Rows whose slug already exists in Firestore are skipped and left untouched.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "upsert"}
                  onChange={() => setMode("upsert")}
                  disabled={importing}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="font-medium text-slate-800">Create + update existing (match by slug)</span>
                  <span className="block text-slate-500">
                    Existing rows get their text fields refreshed. Images, brochure, published/featured status and
                    display order are never touched by import.
                  </span>
                </span>
              </label>
            </div>

            {importError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {importError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button type="button" onClick={handleImport} disabled={!canImport} className={primaryButtonClass}>
                {progressText || (importing ? "Importing…" : "Confirm import")}
              </button>
              {!context && <span className="text-sm text-slate-500">Loading Firestore data…</span>}
            </div>
          </div>
        </Card>
      )}

      {result && (
        <Card title="Result">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Categories</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>Created: {result.categories.created}</li>
                <li>Updated: {result.categories.updated}</li>
                <li>Skipped: {result.categories.skipped}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Products</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>Created: {result.products.created}</li>
                <li>Updated: {result.products.updated}</li>
                <li>Skipped: {result.products.skipped}</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            New products are saved as Draft with no image. Open them from the Solutions tab and use{" "}
            <span className="font-medium">Save &amp; next (needs image)</span> to work through them.
          </p>
        </Card>
      )}
    </div>
  );
}