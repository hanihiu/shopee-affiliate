"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type LinkStatus = "success" | "failed";

type LinkHistoryRecord = {
  id: string;
  affiliateUrl?: string;
  createdAt: string;
  elapsedMs: number;
  error?: string;
  itemId?: string;
  normalizedUrl?: string;
  originalUrl: string;
  provider?: "shopee_web_api" | "manual_redirect";
  requester?: string;
  shopId?: string;
  status: LinkStatus;
  subIds: string[];
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default function Home() {
  const [productUrl, setProductUrl] = useState("");
  const [campaign, setCampaign] = useState("web");
  const [source, setSource] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [result, setResult] = useState<LinkHistoryRecord | null>(null);
  const [history, setHistory] = useState<LinkHistoryRecord[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");

  const subIds = useMemo(
    () =>
      [campaign, source, customTag]
        .map((value) => value.trim())
        .filter(Boolean),
    [campaign, source, customTag],
  );

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/links/history?limit=8`);

      if (!response.ok) {
        return;
      }

      setHistory((await response.json()) as LinkHistoryRecord[]);
    } catch {
      // Backend may not be running yet; form submission will surface the error.
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCopyLabel("Copy");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/links/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: productUrl,
          requester: "public-web",
          subIds,
        }),
      });
      const payload = (await response.json()) as LinkHistoryRecord;

      if (!response.ok) {
        throw new Error(payload.error ?? "Khong tao duoc affiliate link.");
      }

      setResult(payload);
      setHistory((current) => [payload, ...current].slice(0, 8));
    } catch (submitError) {
      setResult(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Khong tao duoc affiliate link.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyAffiliateUrl() {
    if (!result?.affiliateUrl) {
      return;
    }

    await navigator.clipboard.writeText(result.affiliateUrl);
    setCopyLabel("Copied!");
    window.setTimeout(() => setCopyLabel("Copy"), 1400);
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/6 blur-[100px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Affiliate Console
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="gradient-text">Shopee Link</span>{" "}
              <span className="text-on-surface">Generator</span>
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="API" value="NestJS" />
            <MetricCard label="Target" value="< 2s" />
            <MetricCard label="History" value={`${history.length}`} />
          </div>
        </header>

        {/* ── Main grid ── */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* ── Form card ── */}
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-[16px] p-5 sm:p-7 transition-all duration-300"
          >
            <div className="flex flex-col gap-6">
              {/* URL textarea */}
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-on-surface-dim">
                  Link sản phẩm Shopee
                </span>
                <textarea
                  id="product-url-input"
                  className="min-h-28 resize-y rounded-[10px] border border-border bg-surface-elevated px-4 py-3 font-mono text-sm text-on-surface placeholder-on-surface-dim/50 outline-none transition-all duration-200 focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="https://shopee.vn/product/..."
                  value={productUrl}
                  onChange={(event) => setProductUrl(event.target.value)}
                  required
                />
              </label>

              {/* Sub ID inputs */}
              <div className="grid gap-4 md:grid-cols-3">
                <TextInput
                  id="campaign-input"
                  label="Campaign"
                  placeholder="web"
                  value={campaign}
                  onChange={setCampaign}
                />
                <TextInput
                  id="source-input"
                  label="Source"
                  placeholder="facebook"
                  value={source}
                  onChange={setSource}
                />
                <TextInput
                  id="custom-tag-input"
                  label="Custom"
                  placeholder="post_01"
                  value={customTag}
                  onChange={setCustomTag}
                />
              </div>

              {/* Submit row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-on-surface-dim">
                  sub_id:{" "}
                  <span className="font-mono text-on-surface">
                    {subIds.length ? subIds.join("-") : "none"}
                  </span>
                </p>
                <button
                  id="generate-button"
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative h-11 cursor-pointer overflow-hidden rounded-[10px] bg-primary px-6 text-sm font-semibold text-on-primary transition-all duration-200 hover:bg-secondary hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  <span className="relative z-10">
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      "Generate link"
                    )}
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* ── Result card ── */}
          <section className="glass-card rounded-[16px] p-5 sm:p-7 transition-all duration-300">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-on-surface">
                Kết quả
              </h2>
              {result?.elapsedMs ? (
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  {result.elapsedMs}ms
                </span>
              ) : null}
            </div>

            {error ? (
              <div className="mt-4 animate-fade-in rounded-[10px] border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            {result?.affiliateUrl ? (
              <div className="mt-5 flex flex-col gap-4 animate-fade-in">
                {/* URL display */}
                <div className="rounded-[10px] border border-border bg-surface-elevated p-4">
                  <p className="break-all font-mono text-sm leading-relaxed text-on-surface">
                    {result.affiliateUrl}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="copy-button"
                    type="button"
                    onClick={copyAffiliateUrl}
                    className="h-10 cursor-pointer rounded-[10px] border border-border bg-surface-elevated text-sm font-semibold text-on-surface transition-all duration-200 hover:border-on-surface-dim hover:bg-border"
                  >
                    {copyLabel === "Copied!" ? (
                      <span className="flex items-center justify-center gap-1.5 text-success">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </span>
                    ) : (
                      "Copy"
                    )}
                  </button>
                  <a
                    id="open-link"
                    href={result.affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 items-center justify-center rounded-[10px] bg-on-surface px-4 text-sm font-semibold text-surface transition-all duration-200 hover:bg-on-surface/90 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Open ↗
                  </a>
                </div>

                {/* Details */}
                <dl className="grid grid-cols-2 gap-3">
                  <DetailCard
                    label="Provider"
                    value={providerLabel(result)}
                  />
                  <DetailCard
                    label="Item"
                    value={result.itemId ?? "-"}
                  />
                </dl>
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border p-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated">
                  <svg
                    className="h-6 w-6 text-on-surface-dim"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.51a4.5 4.5 0 00-6.364-6.364L4.5 8.01"
                    />
                  </svg>
                </div>
                <p className="text-sm text-on-surface-dim">
                  Link mới sẽ hiển thị ở đây
                </p>
              </div>
            )}
          </section>
        </section>

        {/* ── History ── */}
        <section className="glass-card rounded-[16px] p-5 sm:p-7 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-on-surface">
              Lịch sử
            </h2>
            <button
              id="refresh-history"
              type="button"
              onClick={() => void loadHistory()}
              className="h-9 cursor-pointer rounded-[10px] border border-border bg-surface-elevated px-4 text-sm font-medium text-on-surface transition-all duration-200 hover:border-on-surface-dim hover:bg-border"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {history.length ? (
              history.map((item, index) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  style={{ animationDelay: `${index * 0.05}s` }}
                />
              ))
            ) : (
              <div className="rounded-[10px] border border-dashed border-border px-4 py-6 text-center text-sm text-on-surface-dim">
                Chưa có link nào được tạo.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ===== Sub-components ===== */

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-alt px-3 py-2.5 text-right transition-all duration-200 hover:border-on-surface-dim/30">
      <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-dim">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function TextInput({
  id,
  label,
  onChange,
  placeholder,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-on-surface-dim">
        {label}
      </span>
      <input
        id={id}
        className="h-11 rounded-[10px] border border-border bg-surface-elevated px-4 text-sm text-on-surface placeholder-on-surface-dim/50 outline-none transition-all duration-200 focus:border-primary focus:ring-3 focus:ring-primary/15"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-surface-elevated px-3.5 py-2.5">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-on-surface-dim">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-on-surface">
        {value}
      </dd>
    </div>
  );
}

function HistoryRow({
  item,
  style,
}: {
  item: LinkHistoryRecord;
  style?: React.CSSProperties;
}) {
  return (
    <article
      className="animate-slide-in grid gap-3 rounded-[10px] border border-border bg-surface-alt/50 p-4 transition-all duration-200 hover:border-on-surface-dim/20 hover:bg-surface-alt sm:grid-cols-[1fr_auto] sm:items-center"
      style={style}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              item.status === "success"
                ? "rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success"
                : "rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error"
            }
          >
            {item.status}
          </span>
          <span className="text-xs text-on-surface-dim">
            {new Date(item.createdAt).toLocaleString("vi-VN")}
          </span>
          <span className="text-xs text-on-surface-dim/60">
            {item.elapsedMs}ms
          </span>
        </div>
        <p className="mt-2 truncate font-mono text-sm font-medium text-on-surface">
          {item.affiliateUrl ?? item.error ?? item.originalUrl}
        </p>
        <p className="mt-1 truncate text-xs text-on-surface-dim">
          {item.normalizedUrl ?? item.originalUrl}
        </p>
      </div>
      {item.affiliateUrl ? (
        <a
          href={item.affiliateUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center justify-center rounded-[10px] border border-border bg-surface-elevated px-4 text-sm font-medium text-on-surface transition-all duration-200 hover:border-on-surface-dim hover:bg-border"
        >
          Open ↗
        </a>
      ) : null}
    </article>
  );
}

function providerLabel(item: LinkHistoryRecord) {
  if (item.provider === "manual_redirect") {
    return "Manual redirect";
  }

  if (item.provider === "shopee_web_api") {
    return "Web API";
  }

  return "-";
}
