"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getPaymentRecord, PaymentRecord } from "@/lib/storage";
import { ReceiptCard } from "@/components/ReceiptCard";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const paymentId = resolvedParams.id;

  const [record, setRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = getPaymentRecord(paymentId);
    setRecord(r);
    setLoading(false);
  }, [paymentId]);

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
          No confirmed receipt was found with ID "{paymentId}". Receipts are only created for confirmed on-chain payments.
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
        <Link
          href={`/transaction/${record.id}`}
          className="text-xs font-semibold text-emerald-600 hover:underline"
        >
          View Transaction Details
        </Link>
      </div>

      <ReceiptCard record={record} showActions={true} />
    </div>
  );
}
