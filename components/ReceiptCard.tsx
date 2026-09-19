"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PaymentRecord } from "@/lib/storage";
import { formatAmount, shortAddress, getExplorerUrl } from "@/lib/stellar";
import { Mark, Corners } from "@/components/blackout";
import { ChambaMark } from "@/components/ChambaMark";
import {
  Copy,
  Check,
  Share2,
  Printer,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface ReceiptCardProps {
  record: PaymentRecord;
  showActions?: boolean;
}

export function ReceiptCard({ record, showActions = true }: ReceiptCardProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const receiptUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/receipt/${record.id}`
      : `https://chamba-receipts.vercel.app/receipt/${record.id}`;

  const explorerUrl = record.transactionId ? getExplorerUrl(record.transactionId) : "#";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(receiptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Chamba Receipt - ${record.description}`,
          text: `Payment Receipt: ${formatAmount(record.amount)} ${record.currency} for "${record.description}"`,
          url: receiptUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Official Chamba Receipt:\nPayment of ${formatAmount(record.amount)} ${record.currency} for "${record.description}" has been confirmed on the Stellar network.\nView receipt & proof: ${receiptUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formattedDate = record.paidAt
    ? new Date(record.paidAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date(record.createdAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  const verificationHash = React.useMemo(() => {
    const raw = `${record.id}:${record.transactionId}:${record.workerAddress}:${record.amount}:${record.currency}:${record.paidAt || record.createdAt}`;
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(12, "0").toUpperCase();
    return `CHAMBA-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
  }, [record]);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="bo-panel bo-print-doc relative p-5 sm:p-7 print:p-4">
        <Corners />

        {/* Document header */}
        <header className="flex items-start justify-between gap-4 border-b border-line-2 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-2 bg-surface-3">
              <ChambaMark className="h-5 w-5 text-teal bo-print-accent" />
            </span>
            <div>
              <h2 className="bo-heading text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                Chamba Receipts
              </h2>
              <p className="bo-label-sm mt-1.5">Digital proof of payment</p>
            </div>
          </div>

          <div className="bo-chip bo-chip-ok bo-print-accent shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Paid</span>
          </div>
        </header>

        {/* Amount readout */}
        <div className="bo-panel-inset mt-5 px-4 py-6 text-center">
          <div className="bo-label-sm">Payment received &middot; immutable record</div>
          <div className="mt-3 flex flex-wrap items-baseline justify-center gap-2">
            <span className="bo-display bo-num text-4xl font-medium text-ink sm:text-5xl">
              {formatAmount(record.amount)}
            </span>
            <span className="bo-label text-teal bo-print-accent text-sm tracking-[0.1em]">
              {record.currency}
            </span>
          </div>
          <p className="bo-heading mx-auto mt-3 max-w-xs break-words text-sm text-ink-2">
            {record.description}
          </p>
        </div>

        {/* Ledger detail */}
        <dl className="mt-5 divide-y divide-line-1 border-y border-line-1">
          <div className="flex items-start justify-between gap-4 py-3">
            <dt className="bo-label-sm shrink-0 pt-0.5">Worker</dt>
            <dd className="min-w-0 text-right">
              {record.workerName && (
                <div className="truncate text-sm font-medium text-ink">{record.workerName}</div>
              )}
              <div className="bo-code mt-0.5 text-2xs text-ink-3" title={record.workerAddress}>
                {shortAddress(record.workerAddress, 6, 6)}
              </div>
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4 py-3">
            <dt className="bo-label-sm shrink-0 pt-0.5">Customer</dt>
            <dd className="min-w-0 text-right">
              <div className="truncate text-sm font-medium text-ink">
                {record.payerName || "Independent Customer"}
              </div>
              {record.payerAddress && (
                <div className="bo-code mt-0.5 text-2xs text-ink-3" title={record.payerAddress}>
                  {shortAddress(record.payerAddress, 6, 6)}
                </div>
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="bo-label-sm shrink-0">Settled</dt>
            {/* Rendered in the viewer's own timezone, which the server does not share. */}
            <dd suppressHydrationWarning className="bo-num text-right text-sm text-ink">
              {formattedDate}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="bo-label-sm shrink-0">Receipt ID</dt>
            <dd className="bo-code text-sm font-medium text-teal bo-print-accent">{record.id}</dd>
          </div>

          {record.memo && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="bo-label-sm shrink-0">Stellar memo</dt>
              <dd className="bo-code truncate text-sm text-ink">{record.memo}</dd>
            </div>
          )}

          {record.transactionId && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="bo-label-sm shrink-0">Ledger hash</dt>
              <dd className="min-w-0">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="bo-code inline-flex items-center gap-1.5 text-sm font-medium text-teal bo-print-accent hover:underline"
                >
                  <span>{shortAddress(record.transactionId, 6, 6)}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 print:hidden" aria-hidden="true" />
                </a>
              </dd>
            </div>
          )}

          <div className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="bo-label-sm shrink-0">Checksum</dt>
            <dd className="bo-code break-all text-2xs text-ink-2 sm:text-right">
              {verificationHash}
            </dd>
          </div>
        </dl>

        {/* Verification block */}
        <div className="bo-panel-inset mt-5 flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Mark accent />
              <span className="bo-label text-teal bo-print-accent">Verified on-chain</span>
            </div>
            <p className="mt-2 text-2xs leading-relaxed text-ink-2">
              Issued via Pollar on the Stellar network. Non-custodial, tamper-evident
              proof of income.
            </p>
          </div>
          <div className="shrink-0 bg-white p-2">
            <QRCodeSVG value={receiptUrl} size={64} level="M" />
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-5 grid grid-cols-1 gap-px bg-line-2 sm:grid-cols-3 print:hidden">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="bo-btn bo-btn-secondary min-h-[44px] px-4 py-3 text-xs uppercase tracking-[0.1em]"
            >
              <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="bo-btn bo-btn-secondary min-h-[44px] px-4 py-3 text-xs uppercase tracking-[0.1em]"
            >
              {copied ? (
                <Check className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{copied ? "Copied" : "Copy link"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bo-btn bo-btn-primary min-h-[44px] px-4 py-3 text-xs uppercase tracking-[0.1em]"
            >
              <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Print / PDF</span>
            </button>
          </div>
        )}

        <span aria-live="polite" className="sr-only">
          {copied ? "Receipt link copied to clipboard" : ""}
          {shared ? "Receipt shared" : ""}
        </span>
      </div>
    </div>
  );
}
