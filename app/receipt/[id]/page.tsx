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
        <Loader2 className="h-6 w-6 animate-spin text-teal" aria-label="Loading receipt" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-2">
          <AlertCircle className="h-5 w-5 text-coral" aria-hidden="true" />
        </span>
        <h1 className="bo-display mt-7 text-2xl text-ink">Receipt not found</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-3">
          No confirmed receipt exists with ID{" "}
          <span className="bo-code text-ink-2">{paymentId}</span>. Receipts are generated
          only for verified on-chain payments.
        </p>
        <Link
          href="/dashboard"
          className="bo-btn bo-btn-ghost mt-8 px-5 py-3 text-xs uppercase tracking-[0.1em]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link
          href="/income"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Income history</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {sourceOnChain && (
            <span className="bo-chip bo-chip-ok">
              <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>Resolved from Horizon</span>
            </span>
          )}
          <Link
            href={`/transaction/${record.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.1em] text-teal hover:underline"
          >
            <span>On-chain detail</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <ReceiptCard record={record} showActions={true} />

      <p className="mt-6 text-center text-2xs leading-relaxed text-ink-4 print:hidden">
        Printing renders this receipt as a clean black-on-white document suitable for
        banks, landlords and lenders.
      </p>
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
          <Loader2 className="h-6 w-6 animate-spin text-teal" aria-label="Loading" />
        </div>
      }
    >
      <ReceiptDetailContent paymentId={paymentId} />
    </Suspense>
  );
}
