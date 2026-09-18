"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { usePollar } from "@pollar/react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import {
  getPaymentRequest,
  savePaymentRecord,
  savePaymentRequest,
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
  looksLikeAddress,
  fundWithFriendbot,
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

function PaymentCheckoutContent({ requestId }: { requestId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { runTx, tx, openLoginModal } = usePollar();
  const { user, isAuthenticated, isLoading: isAuthLoading } = usePollarAuth();

  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundingMessage, setFundingMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReceiptId, setConfirmedReceiptId] = useState<string | null>(null);

  const handleFundFriendbot = async () => {
    if (!user?.address) return;
    setFunding(true);
    setFundingMessage("Requesting 10,000 testnet XLM from Stellar Friendbot...");
    const res = await fundWithFriendbot(user.address);
    setFunding(false);
    if (res.ok) {
      setFundingMessage("✓ Wallet funded with 10,000 testnet XLM on Stellar!");
      setErrorMessage(null);
    } else {
      setFundingMessage(`Friendbot notice: ${res.message}`);
    }
  };

  useEffect(() => {
    let r = getPaymentRequest(requestId);

    // If not found in localStorage (e.g. opened on client phone/laptop),
    // hydrate statelessly from URL query parameters:
    if (!r && searchParams) {
      const to = searchParams.get("to");
      const amt = searchParams.get("amt");
      const cur = searchParams.get("cur") as "USDC" | "XLM" | null;
      const memo = searchParams.get("memo") || `CR-${requestId.slice(-6)}`;
      const desc = searchParams.get("desc") || "Payment for Services";
      const worker = searchParams.get("worker") || undefined;
      const customer = searchParams.get("customer") || undefined;

      if (to && looksLikeAddress(to) && amt && !isNaN(Number(amt)) && Number(amt) > 0) {
        r = {
          id: requestId,
          workerAddress: to,
          workerName: worker,
          customerName: customer,
          description: desc,
          amount: amt,
          currency: cur === "XLM" ? "XLM" : "USDC",
          memo: memo,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        // Persist on customer's device so subsequent actions and receipts track it
        savePaymentRequest(r);
      }
    }

    setRequest(r);
    if (r?.confirmedPaymentId) {
      setConfirmedReceiptId(r.confirmedPaymentId);
    }
    setLoading(false);
  }, [requestId, searchParams]);

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
      setStatusMessage("Payment submitted! Awaiting Stellar ledger consensus...");

      // 3. Confirm on Horizon with Exponential Backoff
      const delays = [1500, 2500, 4000, 6000];
      let verifiedResult = await verifyPaymentOnHorizon({
        hash: txHash,
        destination: request.workerAddress,
        amount: request.amount,
        expectedMemo: request.memo,
        currency: request.currency,
      });

      for (let attempt = 0; !verifiedResult.ok && attempt < delays.length; attempt++) {
        setStatusMessage(
          `Waiting for Stellar consensus (attempt ${attempt + 1}/${delays.length + 1})...`
        );
        await new Promise((res) => setTimeout(res, delays[attempt]));
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

      // Auto-redirect to verified receipt with txHash in query parameter
      setTimeout(() => {
        router.push(`/receipt/${receiptId}?tx=${txHash}`);
      }, 1500);
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
          The payment link you visited might be invalid, expired, or missing query parameters.
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
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pollar Verified</span>
          </div>
        </div>

        {/* Worker & Amount */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="text-xs text-slate-500 font-medium">Paying To</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">
            {request.workerName || "Independent Worker"}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {shortAddress(request.workerAddress, 8, 8)}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 py-4 px-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">
              {formatAmount(request.amount)}{" "}
              <span className="text-xl font-bold text-emerald-600">{request.currency}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">{request.description}</div>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="py-5 space-y-2.5 text-xs border-b border-slate-100">
          <div className="flex justify-between">
            <span className="text-slate-500">Receipt Memo ID:</span>
            <span className="font-mono font-bold text-slate-800">{request.memo}</span>
          </div>
          {request.customerName && (
            <div className="flex justify-between">
              <span className="text-slate-500">Billed To:</span>
              <span className="font-medium text-slate-800">{request.customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Network:</span>
            <span className="font-medium text-slate-800">Stellar Testnet</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Settlement Type:</span>
            <span className="font-medium text-emerald-700">Instant Direct Transfer</span>
          </div>
        </div>

        {/* Status / Error feedback */}
        {statusMessage && (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 flex items-center gap-2.5 text-xs text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-blue-600" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50/70 p-3.5 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Testnet Faucet Quick Action */}
        {isAuthenticated && user?.address && (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 block">Need Testnet Funds?</span>
                <span className="text-[11px] text-slate-500">Fund your wallet with 10,000 free testnet XLM</span>
              </div>
              <button
                type="button"
                onClick={handleFundFriendbot}
                disabled={funding}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-50"
              >
                {funding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Funding...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span>Get 10,000 XLM</span>
                  </>
                )}
              </button>
            </div>
            {fundingMessage && (
              <div className="mt-2.5 rounded-lg bg-white p-2.5 text-[11px] font-medium text-slate-800 border border-blue-200">
                {fundingMessage}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 space-y-3">
          {isAuthenticated ? (
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function PaymentCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const requestId = resolvedParams.id;

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <PaymentCheckoutContent requestId={requestId} />
    </Suspense>
  );
}
