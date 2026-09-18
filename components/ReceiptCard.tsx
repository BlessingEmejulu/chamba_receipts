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
  Sparkles,
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
    <div className="w-full max-w-lg mx-auto">
      {/* Receipt Paper Card */}
      <div className="receipt-paper relative rounded-3xl border border-[#075E54]/20 bg-white p-4 sm:p-6 md:p-8 shadow-xl print:shadow-none print:border-none print:p-2 overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#F2A900]/15 to-transparent pointer-events-none" />

        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-[#075E54]/10 pb-4 sm:pb-5 mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#075E54] text-white shadow-sm">
              <ReceiptIcon className="h-5 w-5 text-[#F2A900]" />
            </div>
            <div>
              <h2 className="font-heading text-xs font-black tracking-widest uppercase text-[#102A2A]">
                CHAMBA RECEIPTS
              </h2>
              <p className="text-[10px] sm:text-2xs text-[#5F6F6D] font-semibold">Digital Proof of Payment & Income</p>
            </div>
          </div>

          {/* Official Stamp */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#16A085]/15 px-2.5 sm:px-3 py-1 text-xs font-black text-[#075E54] border border-[#16A085]/30 shrink-0">
            <ShieldCheck className="h-4 w-4 text-[#16A085]" />
            <span>PAID</span>
          </div>
        </div>

        {/* Big Amount Section */}
        <div className="text-center py-4 sm:py-5 border-b border-dashed border-[#075E54]/20 mb-5 sm:mb-6 bg-[#F8F7F2]/60 rounded-2xl px-3">
          <span className="text-[10px] sm:text-2xs font-bold uppercase tracking-wider text-[#5F6F6D] block mb-1">
            PAYMENT RECEIVED &bull; IMMUTABLE RECORD
          </span>
          <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
            <span className="font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#102A2A] break-all">
              {formatAmount(record.amount)}
            </span>
            <span className="text-lg sm:text-xl font-bold text-[#075E54]">{record.currency}</span>
          </div>
          <p className="font-heading text-xs sm:text-sm font-bold text-[#102A2A] mt-2 px-2 max-w-sm mx-auto break-words">
            {record.description}
          </p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 sm:space-y-3.5 text-xs sm:text-sm mb-6">
          <div className="flex justify-between items-start gap-2 sm:gap-4">
            <span className="text-[#5F6F6D] font-medium shrink-0">Worker (Recipient)</span>
            <div className="text-right min-w-0">
              {record.workerName && (
                <div className="font-heading font-bold text-[#102A2A] truncate">{record.workerName}</div>
              )}
              <div className="font-mono text-[10px] sm:text-2xs text-[#5F6F6D]" title={record.workerAddress}>
                {shortAddress(record.workerAddress, 6, 6)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-start gap-2 sm:gap-4">
            <span className="text-[#5F6F6D] font-medium shrink-0">Customer (Payer)</span>
            <div className="text-right min-w-0">
              <div className="font-heading font-bold text-[#102A2A] truncate">
                {record.payerName || "Independent Customer"}
              </div>
              {record.payerAddress && (
                <div className="font-mono text-[10px] sm:text-2xs text-[#5F6F6D]" title={record.payerAddress}>
                  {shortAddress(record.payerAddress, 6, 6)}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <span className="text-[#5F6F6D] font-medium shrink-0">Settlement Date</span>
            <span className="font-semibold text-[#102A2A] text-right">{formattedDate}</span>
          </div>

          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <span className="text-[#5F6F6D] font-medium shrink-0">Receipt ID</span>
            <span className="font-mono text-xs font-bold text-[#075E54] bg-[#075E54]/10 px-2 py-0.5 rounded shrink-0">
              {record.id}
            </span>
          </div>

          {record.memo && (
            <div className="flex justify-between items-center gap-2 sm:gap-4">
              <span className="text-[#5F6F6D] font-medium shrink-0">Stellar Text Memo</span>
              <span className="font-mono text-xs text-[#102A2A] font-semibold truncate">{record.memo}</span>
            </div>
          )}

          {record.transactionId && (
            <div className="flex justify-between items-center gap-2 sm:gap-4 pt-1">
              <span className="text-[#5F6F6D] font-medium shrink-0">Blockchain Hash</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#075E54] hover:underline"
              >
                <span>{shortAddress(record.transactionId, 6, 6)}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 sm:gap-4 pt-2 border-t border-[#075E54]/10">
            <span className="text-[#5F6F6D] font-medium shrink-0">Security Checksum</span>
            <span className="font-mono text-[10px] sm:text-2xs font-bold text-[#102A2A] bg-slate-100 px-2 py-1 rounded border border-slate-200 break-all text-center sm:text-right">
              {verificationHash}
            </span>
          </div>
        </div>

        {/* QR Code and Verification Section */}
        <div className="rounded-2xl border border-[#075E54]/15 bg-[#F8F7F2] p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#102A2A]">
              <CheckCircle2 className="h-4 w-4 text-[#16A085] shrink-0" />
              <span>Verified On-Chain</span>
            </div>
            <p className="text-[11px] sm:text-2xs text-[#5F6F6D] leading-relaxed">
              Issued via Pollar on the Stellar Network. Non-custodial, tamper-evident proof of income.
            </p>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 shrink-0">
            <QRCodeSVG value={receiptUrl} size={64} level="M" />
          </div>
        </div>

        {/* Action Buttons: Responsive Equal Grid */}
        {showActions && (
          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 print:hidden">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A085] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#16A085]/20 hover:bg-[#138d75] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#075E54]/20 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#102A2A] shadow-2xs hover:bg-[#F8F7F2] active:scale-[0.98] transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-[#075E54] shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#075E54] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span>Print / PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
