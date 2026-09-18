"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPaymentRecord, savePaymentRecord, PaymentRecord } from "@/lib/storage";
import { fetchPaymentFromHorizon } from "@/lib/stellar";
import { ReceiptCard } from "@/components/ReceiptCard";
import { ArrowLeft, AlertCircle, Loader2, ShieldCheck, ChevronRight } from "lucide-react";

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
        <h1 className="font-heading text-2xl font-bold text-[#102A2A]">Receipt Not Found</h1>
        <p className="text-xs text-[#5F6F6D] mt-1.5 max-w-xs mx-auto leading-relaxed">
          No confirmed receipt was found with ID &ldquo;{paymentId}&rdquo;. Receipts are generated for verified on-chain payments.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#075E54] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5F6F6D] hover:text-[#102A2A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Income History</span>
        </Link>
        <div className="flex items-center gap-3">
          {sourceOnChain && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#16A085]/15 px-3 py-1 text-2xs font-bold text-[#075E54] border border-[#16A085]/30">
              <ShieldCheck className="h-3 w-3 text-[#16A085]" />
              <span>Resolved from Stellar Horizon</span>
            </span>
          )}
          <Link
            href={`/transaction/${record.id}`}
            className="text-xs font-bold text-[#075E54] hover:underline flex items-center gap-0.5"
          >
            <span>On-chain Details</span>
            <ChevronRight className="h-3.5 w-3.5" />
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
        <div className="flex flex-1 items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
        </div>
      }
    >
      <ReceiptDetailContent paymentId={paymentId} />
    </Suspense>
  );
}
