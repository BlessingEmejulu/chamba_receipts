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
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Transaction Not Found</h1>
        <p className="text-xs text-slate-500 mt-1">
          No confirmed transaction found for ID "{paymentId}".
        </p>
        <Link
          href="/income"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 w-full">
      <div className="mb-6">
        <Link
          href="/income"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Income History</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Transaction Details
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{record.description}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>CONFIRMED SUCCESSFUL</span>
            </span>
            <Link
              href={`/receipt/${record.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-2xs"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Digital Receipt</span>
            </Link>
          </div>
        </div>

        {/* Big Amount Badge */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">Total Amount Settled</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
              {formatAmount(record.amount)} <span className="text-emerald-600 text-lg">{record.currency}</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-left sm:text-right">
            <div>Receipt ID: <span className="font-mono font-semibold text-slate-800">{record.id}</span></div>
            <div>Request Ref: <span className="font-mono text-slate-700">{record.paymentRequestId}</span></div>
          </div>
        </div>

        {/* On-Chain Audit Grid */}
        <div className="space-y-4 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" /> Date & Time
            </span>
            <span className="font-medium text-slate-800">{formattedDate}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-400" /> Beneficiary Worker
            </span>
            <div className="text-left sm:text-right">
              <div className="font-semibold text-slate-900">{record.workerName || "Worker"}</div>
              <div className="font-mono text-xs text-slate-500 select-all">{record.workerAddress}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-slate-400" /> Customer Payer
            </span>
            <div className="text-left sm:text-right">
              <div className="font-semibold text-slate-900">{record.payerName || "Customer"}</div>
              {record.payerAddress && (
                <div className="font-mono text-xs text-slate-500 select-all">{record.payerAddress}</div>
              )}
            </div>
          </div>

          {record.memo && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-1">
              <span className="text-slate-500">Stellar Memo (Text)</span>
              <span className="font-mono font-medium text-slate-800">{record.memo}</span>
            </div>
          )}

          {record.transactionId && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-slate-400" /> Stellar Transaction Hash
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-700 select-all max-w-[240px] truncate">
                  {record.transactionId}
                </span>
                <button
                  onClick={handleCopyHash}
                  className="rounded p-1 text-slate-400 hover:text-slate-700"
                  title="Copy full hash"
                >
                  {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  <span>Stellar Expert</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Verification guarantee */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-900 block font-semibold mb-0.5">
              Verified Settlement on Stellar Blockchain
            </strong>
            This transaction was built, signed, and sponsored via Pollar and finalized on the Stellar decentralized ledger. It represents verifiable proof of earnings.
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
        <div className="flex flex-1 items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <TransactionDetailContent paymentId={paymentId} />
    </Suspense>
  );
}
