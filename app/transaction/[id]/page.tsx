"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPaymentRecord, savePaymentRecord, PaymentRecord } from "@/lib/storage";
import { formatAmount, getExplorerUrl, fetchPaymentFromHorizon } from "@/lib/stellar";
import { Mark, Corners } from "@/components/blackout";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
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
        <Loader2 className="h-6 w-6 animate-spin text-teal" aria-label="Loading transaction" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-2">
          <AlertCircle className="h-5 w-5 text-coral" aria-hidden="true" />
        </span>
        <h1 className="bo-display mt-7 text-2xl text-ink">Transaction not found</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-3">
          No confirmed transaction found for{" "}
          <span className="bo-code text-ink-2">{paymentId}</span>.
        </p>
        <Link
          href="/income"
          className="bo-btn bo-btn-ghost mt-8 px-5 py-3 text-xs uppercase tracking-[0.1em]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Income history</span>
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
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/income"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Income history</span>
        </Link>

        <Link
          href={`/receipt/${record.id}`}
          className="bo-btn bo-btn-ghost px-4 py-2.5 text-2xs uppercase tracking-[0.12em]"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Official receipt</span>
        </Link>
      </div>

      {/* Ledger record */}
      <article className="bo-panel relative mt-6 p-6 sm:p-8">
        <Corners />

        <header className="flex flex-col gap-5 border-b border-line-2 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-teal/30 bg-teal/8">
              <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="bo-heading text-base font-medium text-ink">
                  Stellar payment transaction
                </h1>
                <span className="bo-chip bo-chip-ok">Successful</span>
                {sourceOnChain && <span className="bo-chip">From Horizon</span>}
              </div>
              <p className="bo-label-sm mt-2">Cryptographically settled on the ledger</p>
            </div>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <div className="bo-display bo-num text-2xl text-ink sm:text-3xl">
              {formatAmount(record.amount)}{" "}
              <span className="bo-label-sm text-sm text-teal">{record.currency}</span>
            </div>
            <div className="bo-label-sm mt-2">Direct transfer</div>
          </div>
        </header>

        {/* Hash block */}
        <div className="bo-panel-inset mt-6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="bo-label-sm">Transaction hash</span>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCopyHash}
                className="inline-flex items-center gap-1.5 text-2xs font-medium uppercase tracking-[0.12em] text-ink-3 hover:text-ink"
              >
                {copiedHash ? (
                  <Check className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{copiedHash ? "Copied" : "Copy"}</span>
              </button>
              {record.transactionId && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-2xs font-medium uppercase tracking-[0.12em] text-teal hover:underline"
                >
                  <span>Explorer</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
          <div className="bo-code mt-3 select-all break-all text-xs text-ink">
            {record.transactionId || "N/A"}
          </div>
        </div>

        {/* Ledger fields */}
        <dl className="mt-6 divide-y divide-line-1 border-y border-line-1">
          <div className="flex items-start justify-between gap-4 py-3.5">
            <dt className="bo-label-sm shrink-0 pt-0.5">Purpose</dt>
            <dd className="min-w-0 text-right text-sm font-medium text-ink">
              {record.description}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4 py-3.5">
            <dt className="bo-label-sm shrink-0 pt-0.5">Worker</dt>
            <dd className="min-w-0 text-right">
              {record.workerName && (
                <div className="text-sm font-medium text-ink">{record.workerName}</div>
              )}
              <div className="bo-code mt-1 select-all break-all text-2xs text-ink-3">
                {record.workerAddress}
              </div>
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4 py-3.5">
            <dt className="bo-label-sm shrink-0 pt-0.5">Payer</dt>
            <dd className="min-w-0 text-right">
              <div className="text-sm font-medium text-ink">
                {record.payerName || "Independent Customer"}
              </div>
              {record.payerAddress && (
                <div className="bo-code mt-1 select-all break-all text-2xs text-ink-3">
                  {record.payerAddress}
                </div>
              )}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4 py-3.5">
            <dt className="bo-label-sm shrink-0 pt-0.5">Timestamp</dt>
            <dd className="bo-num min-w-0 text-right text-sm text-ink">{formattedDate}</dd>
          </div>

          {record.memo && (
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="bo-label-sm shrink-0">Stellar memo</dt>
              <dd className="bo-code text-sm text-teal">{record.memo}</dd>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 py-3.5">
            <dt className="bo-label-sm shrink-0">Custody model</dt>
            <dd className="flex items-center gap-2 text-sm text-teal">
              <Mark accent />
              Non-custodial direct
            </dd>
          </div>
        </dl>

        <footer className="mt-6 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
          <span className="text-2xs leading-relaxed text-ink-3">
            This record mirrors the public Stellar ledger. Anyone can independently verify
            it through the explorer link above without trusting Chamba.
          </span>
        </footer>
      </article>
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
          <Loader2 className="h-6 w-6 animate-spin text-teal" aria-label="Loading" />
        </div>
      }
    >
      <TransactionDetailContent paymentId={paymentId} />
    </Suspense>
  );
}
