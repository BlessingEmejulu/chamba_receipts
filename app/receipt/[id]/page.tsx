"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPaymentRecord, savePaymentRecord, PaymentRecord } from "@/lib/storage";
import { fetchPaymentFromHorizon } from "@/lib/stellar";
import { ReceiptCard } from "@/components/ReceiptCard";
import { ArrowLeft, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

function ReceiptDetailContent({ paymentId }: { paymentId: string }) {
  const searchParams = useSearchParams();
  const txParam = searchParams.get("tx");

  const [record, setRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceOnChain, setSourceOnChain] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      // 1. Try local storage cache first
      let r = getPaymentRecord(paymentId);

      // 2. If not found locally, try on-chain Horizon resolution using txParam or paymentId
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

    loadReceipt();
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
        <h1 className="text-xl font-bold text-slate-900">Receipt Not Found</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          No confirmed receipt was found with ID "{paymentId}". Receipts are generated for verified on-chain payments.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 w-full">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/income"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Income History</span>
        </Link>
        <div className="flex items-center gap-3">
          {sourceOnChain && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
              <ShieldCheck className="h-3 w-3" />
              <span>Resolved from Stellar Horizon</span>
            </span>
          )}
          <Link
            href={`/transaction/${record.id}`}
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            View Blockchain Details
          </Link>
        </div>
      </div>

      <ReceiptCard record={record} showActions={true} />
    </div>
  );
}

export default function ReceiptDetailPage({
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
      <ReceiptDetailContent paymentId={paymentId} />
    </Suspense>
  );
}
