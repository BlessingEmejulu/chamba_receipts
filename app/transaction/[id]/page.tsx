"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPaymentRecord, savePaymentRecord, PaymentRecord } from "@/lib/storage";
import { formatAmount, shortAddress, getExplorerUrl, fetchPaymentFromHorizon } from "@/lib/stellar";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Hash,
  Clock,
  User,
  CreditCard,
  Loader2,
} from "lucide-react";

function TransactionDetailContent({ paymentId }: { paymentId: string }) {
  const searchParams = useSearchParams();
  const txParam = searchParams.get("tx");

  const [record, setRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);
  const [sourceOnChain, setSourceOnChain] = useState(false);

  useEffect(() => {
    async function loadTx() {
      let r = getPaymentRecord(paymentId);
      const targetHash = txParam || (/^[a-f0-9]{64}$/i.test(paymentId) ? paymentId : null);

      if (!r && targetHash) {
        const onChain = await fetchPaymentFromHorizon(targetHash);
        if (onChain) {
          r = {
            id: onChain.memo || paymentId,
            paymentRequestId: `REQ-${targetHash.slice(0, 6).toUpperCase()}`,
            transactionId: onChain.txHash,
            workerAddress: onChain.workerAddress,
            payerAddress: onChain.sourceAccount,
            description: "Verified Stellar Payment",
            amount: onChain.amount,
            currency: onChain.currency,
            status: "successful",
            memo: onChain.memo,
            createdAt: onChain.createdAt,
            paidAt: onChain.createdAt,
          };
          savePaymentRecord(r);
          setSourceOnChain(true);
        }
      }

      setRecord(r);
      setLoading(false);
    }

    loadTx();
  }, [paymentId, txParam]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#102A2A]">Transaction Not Found</h1>
        <p className="text-xs text-[#5F6F6D] mt-1.5 leading-relaxed">
          No confirmed transaction found for ID &ldquo;{paymentId}&rdquo;.
        </p>
        <Link
          href="/income"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#075E54] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Income History</span>
        </Link>
      </div>
    );
  }

  const explorerUrl = record.transactionId ? getExplorerUrl(record.transactionId) : "#";

  const handleCopyHash = async () => {
    if (!record.transactionId) return;
    try {
      await navigator.clipboard.writeText(record.transactionId);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // ignore
    }
  };

  const formattedDate = record.paidAt
    ? new Date(record.paidAt).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "medium",
      })
    : new Date(record.createdAt).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "medium",
      });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 w-full space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/income"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5F6F6D] hover:text-[#102A2A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Income History</span>
        </Link>

        <Link
          href={`/receipt/${record.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#075E54]/20 bg-white px-4 py-2 text-xs font-bold text-[#075E54] hover:bg-[#F8F7F2] transition-all shadow-2xs"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>View Official Receipt</span>
        </Link>
      </div>

      {/* Transaction Summary Card */}
      <div className="rounded-3xl border border-[#075E54]/15 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16A085]/15 text-[#075E54]">
              <CheckCircle2 className="h-7 w-7 text-[#16A085]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold text-[#102A2A]">
                  Stellar Payment Transaction
                </h1>
                <span className="inline-flex items-center rounded-full bg-[#16A085]/15 px-2.5 py-0.5 text-2xs font-bold text-[#075E54] border border-[#16A085]/30">
                  SUCCESSFUL
                </span>
              </div>
              <p className="text-xs text-[#5F6F6D] mt-0.5">
                Cryptographically settled on Stellar Horizon Ledger
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#102A2A]">
              {formatAmount(record.amount)} {record.currency}
            </div>
            <div className="text-2xs text-[#5F6F6D]">Direct Transfer</div>
          </div>
        </div>

        {/* Ledger Details Grid */}
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Transaction Hash */}
          <div className="rounded-2xl border border-slate-100 bg-[#F8F7F2] p-4">
            <div className="flex items-center justify-between text-xs text-[#5F6F6D] mb-1.5 font-medium">
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-[#075E54]" />
                Transaction Hash (TxID)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHash}
                  className="hover:text-[#102A2A] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedHash ? <Check className="h-3.5 w-3.5 text-[#075E54]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedHash ? "Copied" : "Copy"}</span>
                </button>
                {record.transactionId && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[#075E54] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="font-mono text-xs sm:text-sm text-[#102A2A] break-all select-all font-semibold">
              {record.transactionId || "N/A"}
            </div>
          </div>

          {/* Description */}
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-[#5F6F6D] font-medium">Payment Purpose</span>
            <span className="font-bold text-[#102A2A]">{record.description}</span>
          </div>

          {/* Recipient */}
          <div className="flex justify-between items-start py-2 border-b border-slate-100">
            <span className="text-[#5F6F6D] font-medium">Worker (Recipient)</span>
            <div className="text-right">
              {record.workerName && (
                <div className="font-bold text-[#102A2A]">{record.workerName}</div>
              )}
              <div className="font-mono text-2xs text-[#5F6F6D] select-all">
                {record.workerAddress}
              </div>
            </div>
          </div>

          {/* Payer */}
          <div className="flex justify-between items-start py-2 border-b border-slate-100">
            <span className="text-[#5F6F6D] font-medium">Payer (Customer)</span>
            <div className="text-right">
              <div className="font-bold text-[#102A2A]">
                {record.payerName || "Independent Customer"}
              </div>
              {record.payerAddress && (
                <div className="font-mono text-2xs text-[#5F6F6D] select-all">
                  {record.payerAddress}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-[#5F6F6D] font-medium">Timestamp</span>
            <span className="font-semibold text-[#102A2A]">{formattedDate}</span>
          </div>

          {/* Stellar Memo */}
          {record.memo && (
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-[#5F6F6D] font-medium">Stellar Text Memo</span>
              <span className="font-mono text-xs font-bold text-[#075E54]">{record.memo}</span>
            </div>
          )}

          {/* Custody Model */}
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-[#5F6F6D] font-medium">Custody Model</span>
            <span className="font-bold text-[#075E54] flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-[#16A085]" />
              Non-custodial Direct
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const paymentId = resolvedParams.id;

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
        </div>
      }
    >
      <TransactionDetailContent paymentId={paymentId} />
    </Suspense>
  );
}
