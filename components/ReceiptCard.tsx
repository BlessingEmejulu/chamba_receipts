"use client";

import React, { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { PaymentRecord } from "@/lib/storage";
import { formatAmount, shortAddress, getExplorerUrl } from "@/lib/stellar";
import {
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Printer,
  ExternalLink,
  ShieldCheck,
  Receipt as ReceiptIcon,
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

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Receipt Paper Card */}
      <div className="receipt-paper relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl print:shadow-none print:border-none print:p-2">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ReceiptIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-800">
                CHAMBA RECEIPTS
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Digital Proof of Payment</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>PAID</span>
          </div>
        </div>

        {/* Big Amount Section */}
        <div className="text-center py-4 border-b border-dashed border-slate-200 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            PAYMENT RECEIVED
          </span>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              {formatAmount(record.amount)}
            </span>
            <span className="text-lg font-bold text-emerald-600">{record.currency}</span>
          </div>
          <p className="text-sm font-medium text-slate-700 mt-2 px-4 max-w-sm mx-auto">
            {record.description}
          </p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3.5 text-sm mb-6">
          <div className="flex justify-between items-start gap-4">
            <span className="text-slate-500">Recipient (Worker)</span>
            <div className="text-right">
              {record.workerName && (
                <div className="font-semibold text-slate-900">{record.workerName}</div>
              )}
              <div className="font-mono text-xs text-slate-600" title={record.workerAddress}>
                {shortAddress(record.workerAddress, 6, 6)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-slate-500">Payer (Customer)</span>
            <div className="text-right">
              <div className="font-semibold text-slate-900">
                {record.payerName || "Independent Customer"}
              </div>
              {record.payerAddress && (
                <div className="font-mono text-xs text-slate-600" title={record.payerAddress}>
                  {shortAddress(record.payerAddress, 6, 6)}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-500">Date & Time</span>
            <span className="font-medium text-slate-800">{formattedDate}</span>
          </div>

          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-500">Receipt ID</span>
            <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {record.id}
            </span>
          </div>

          {record.memo && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-500">Stellar Memo</span>
              <span className="font-mono text-xs text-slate-700">{record.memo}</span>
            </div>
          )}

          {record.transactionId && (
            <div className="flex justify-between items-center gap-4 pt-1">
              <span className="text-slate-500">Blockchain Hash</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-mono text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                <span>{shortAddress(record.transactionId, 6, 6)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* QR Code and Verification Section */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Verified On-Chain
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Powered by Pollar on the Stellar Network. Non-custodial, tamper-evident proof of income.
            </p>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200/80 shrink-0">
            <QRCodeSVG value={receiptUrl} size={64} level="M" />
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-6 flex flex-wrap gap-2.5 print:hidden">
            <button
              onClick={handleCopyLink}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <Share2 className="h-4 w-4" />
              <span>{shared ? "Shared!" : "Share"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print / PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
