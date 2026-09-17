"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { usePollar } from "@pollar/react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import {
  getPaymentRequest,
  savePaymentRecord,
  updatePaymentRequestStatus,
  PaymentRequest,
  PaymentRecord,
  generateId,
} from "@/lib/storage";
import {
  formatAmount,
  shortAddress,
  getPaymentAsset,
  verifyPaymentOnHorizon,
  getExplorerUrl,
} from "@/lib/stellar";
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";

export default function PaymentCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const requestId = resolvedParams.id;
  const router = useRouter();

  const { runTx, tx, openLoginModal } = usePollar();
  const { user, isAuthenticated, isLoading: isAuthLoading } = usePollarAuth();

  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReceiptId, setConfirmedReceiptId] = useState<string | null>(null);

  useEffect(() => {
    const r = getPaymentRequest(requestId);
    setRequest(r);
    if (r?.confirmedPaymentId) {
      setConfirmedReceiptId(r.confirmedPaymentId);
    }
    setLoading(false);
  }, [requestId]);

  const handlePay = async () => {
    if (!request) return;
    if (!isAuthenticated || !user?.address) {
      openLoginModal();
      return;
    }

    setPaying(true);
    setErrorMessage(null);
    setStatusMessage("Preparing transaction on Stellar network...");

    try {
      // 1. Prepare payment asset
      const assetParam = getPaymentAsset(request.currency);

      setStatusMessage("Please sign the payment in your Pollar wallet...");

      // 2. Execute real Pollar transaction via runTx (build -> sign -> submit)
      const outcome = await runTx(
        "payment",
        {
          destination: request.workerAddress,
          amount: request.amount,
          asset: assetParam,
        },
        {
          memo: {
            type: "text",
            value: request.memo,
          },
        }
      );

      if (outcome.status === "error") {
        setPaying(false);
        setStatusMessage(null);
        setErrorMessage(
          outcome.details ||
            outcome.message ||
            "The payment was rejected or failed. Please check your wallet and try again."
        );
        return;
      }

      const txHash = outcome.hash;
      setStatusMessage("Payment submitted! Verifying confirmation on Stellar Horizon...");

      // 3. Confirm on Horizon
      let verifiedResult = await verifyPaymentOnHorizon({
        hash: txHash,
        destination: request.workerAddress,
        amount: request.amount,
        expectedMemo: request.memo,
        currency: request.currency,
      });

      // If Horizon is indexing, retry up to 2 times with a slight delay
      if (!verifiedResult.ok) {
        await new Promise((res) => setTimeout(res, 2000));
        verifiedResult = await verifyPaymentOnHorizon({
          hash: txHash,
          destination: request.workerAddress,
          amount: request.amount,
          expectedMemo: request.memo,
          currency: request.currency,
        });
      }

      // 4. Create Confirmed Payment Record
      const receiptId = generateId("CR");
      const confirmedRecord: PaymentRecord = {
        id: receiptId,
        paymentRequestId: request.id,
        transactionId: txHash,
        workerAddress: request.workerAddress,
        workerName: request.workerName,
        payerAddress: verifiedResult.payerAddress || user.address,
        payerName: user.displayName || user.email || "Pollar Customer",
        description: request.description,
        amount: request.amount,
        currency: request.currency,
        status: "successful",
        memo: request.memo,
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };

      savePaymentRecord(confirmedRecord);
      updatePaymentRequestStatus(request.id, "successful", receiptId);
      setConfirmedReceiptId(receiptId);
      setPaying(false);
      setStatusMessage(null);

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setPaying(false);
      setStatusMessage(null);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Payment error: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Payment Request Not Found</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          The payment link you visited might be invalid or expired.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
        >
          <span>Go to Chamba Receipts Home</span>
        </Link>
      </div>
    );
  }

  // If already confirmed paid:
  if (confirmedReceiptId) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 w-full text-center">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-10 w-10" />
          </div>

          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 mb-2">
              PAYMENT COMPLETE
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {formatAmount(request.amount)} {request.currency} Paid
            </h1>
            <p className="text-sm text-slate-600 mt-1">{request.description}</p>
          </div>

          <p className="text-xs text-slate-500">
            This payment was confirmed on the Stellar network. Your digital receipt has been generated.
          </p>

          <Link
            href={`/receipt/${confirmedReceiptId}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <span>View Digital Receipt</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12 w-full">
      {/* Checkout Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              CHAMBA CHECKOUT
            </span>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending Payment
          </span>
        </div>

        {/* Invoice Summary */}
        <div className="text-center py-4 border-b border-dashed border-slate-200 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Amount Due
          </span>
          <div className="flex items-baseline justify-center gap-1.5 mt-1">
            <span className="text-4xl font-extrabold text-slate-900">
              {formatAmount(request.amount)}
            </span>
            <span className="text-base font-bold text-emerald-600">{request.currency}</span>
          </div>
          <p className="text-sm font-medium text-slate-700 mt-2 px-2">
            {request.description}
          </p>
        </div>

        {/* Payee Info */}
        <div className="space-y-3 text-xs mb-6">
          <div className="flex justify-between">
            <span className="text-slate-500">Service Provider:</span>
            <span className="font-semibold text-slate-900">
              {request.workerName || "Independent Worker"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Recipient Address:</span>
            <span className="font-mono text-slate-600">
              {shortAddress(request.workerAddress, 6, 6)}
            </span>
          </div>
          {request.customerName && (
            <div className="flex justify-between">
              <span className="text-slate-500">Billed To:</span>
              <span className="font-medium text-slate-800">{request.customerName}</span>
            </div>
          )}
          {request.paymentReference && (
            <div className="flex justify-between">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono text-slate-700">{request.paymentReference}</span>
            </div>
          )}
        </div>

        {/* Status / Error feedback */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-pulse">
            <Loader2 className="h-4 w-4 shrink-0 text-emerald-600 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Payment CTA Buttons */}
        <div className="space-y-3 pt-2">
          {isAuthenticated ? (
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {paying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  <span>
                    Pay {formatAmount(request.amount)} {request.currency} with Pollar
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              disabled={isAuthLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <Wallet className="h-5 w-5" />
              <span>Connect Pollar Wallet to Pay</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Non-custodial payment verified on Stellar Ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
}
