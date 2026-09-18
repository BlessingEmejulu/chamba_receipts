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
  looksLikeAddress,
  fundWithFriendbot,
} from "@/lib/stellar";
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sparkles,
  HeartHandshake,
  Coins,
} from "lucide-react";

function PaymentCheckoutContent({ requestId }: { requestId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { runTx, openLoginModal } = usePollar();
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
        const rawErr = outcome.details || outcome.message || "";
        if (/trustline|no trustline|op_no_trust/i.test(rawErr)) {
          setErrorMessage(
            "The recipient's wallet has not opened a USDC trustline yet. On Stellar, accounts must enable trustlines to receive non-native assets. The recipient can add the USDC trustline in their Chamba Profile, or create a payment link in XLM (which requires no trustline)."
          );
        } else {
          setErrorMessage(
            rawErr ||
              "The payment was rejected or failed. Please check your wallet and try again."
          );
        }
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
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#075E54", "#F2A900", "#16A085", "#102A2A"],
        });
      } catch {
        // ignore
      }

      // Auto-redirect to verified receipt with txHash in query parameter
      setTimeout(() => {
        router.push(`/receipt/${receiptId}?tx=${txHash}`);
      }, 1800);
    } catch (err: unknown) {
      setPaying(false);
      setStatusMessage(null);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Payment error: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#102A2A]">Payment Request Not Found</h1>
        <p className="text-xs text-[#5F6F6D] mt-1.5 max-w-xs mx-auto leading-relaxed">
          The payment link you visited might be invalid, expired, or missing query parameters.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#075E54] hover:underline"
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
        <div className="rounded-3xl border border-[#075E54]/20 bg-white p-8 shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#16A085]/15 text-[#075E54]">
            <CheckCircle2 className="h-10 w-10 text-[#16A085]" />
          </div>

          <div>
            <span className="inline-flex items-center rounded-full bg-[#16A085]/15 px-3 py-1 text-2xs font-bold text-[#075E54] border border-[#16A085]/30 mb-3">
              PAYMENT COMPLETE &bull; ON-CHAIN VERIFIED
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-[#102A2A]">
              Payment received. Another win!
            </h1>
            <p className="text-sm font-semibold text-[#075E54] mt-1">
              Your hard work just paid off.
            </p>
            <p className="text-xs text-[#5F6F6D] mt-2">
              {formatAmount(request.amount)} {request.currency} for &ldquo;{request.description}&rdquo;
            </p>
          </div>

          <p className="text-xs text-[#5F6F6D] leading-relaxed">
            This payment was confirmed on Stellar ledger. Your immutable digital proof of income has been issued.
          </p>

          <Link
            href={`/receipt/${confirmedReceiptId}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#075E54] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all"
          >
            <span>View Digital Receipt</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-3.5 sm:px-4 py-6 sm:py-10 md:py-12 w-full">
      {/* Checkout Card */}
      <div className="rounded-3xl border border-[#075E54]/20 bg-white p-5 sm:p-7 md:p-8 shadow-xl">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-5 mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#075E54] text-white">
              <Receipt className="h-5 w-5 text-[#F2A900]" />
            </div>
            <div>
              <span className="font-heading text-xs font-black tracking-wider text-[#102A2A] uppercase block leading-none">
                CHAMBA CHECKOUT
              </span>
              <span className="text-[10px] text-[#5F6F6D] font-medium">Simple. Secure. Non-custodial.</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#16A085]/10 px-2.5 py-1 text-[11px] font-bold text-[#075E54] border border-[#16A085]/20 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A085] animate-pulse" />
            <span>Pollar Verified</span>
          </div>
        </div>

        {/* Worker & Amount */}
        <div className="text-center pb-5 sm:pb-6 border-b border-slate-100">
          <div className="text-xs text-[#5F6F6D] font-semibold uppercase tracking-wider">Paying Directly To</div>
          <div className="font-heading text-lg font-bold text-[#102A2A] mt-1 truncate">
            {request.workerName || "Independent Worker"}
          </div>
          <div className="text-[10px] sm:text-2xs font-mono text-[#5F6F6D] mt-0.5">
            {shortAddress(request.workerAddress, 8, 8)}
          </div>

          <div className="mt-4 sm:mt-5 rounded-2xl bg-[#F8F7F2] border border-[#075E54]/10 py-4 sm:py-5 px-3 sm:px-4">
            <div className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A] break-all">
              {formatAmount(request.amount)}{" "}
              <span className="text-xl font-bold text-[#075E54]">{request.currency}</span>
            </div>
            <div className="text-xs text-[#5F6F6D] font-medium mt-1 break-words">{request.description}</div>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="py-4 sm:py-5 space-y-2.5 text-xs border-b border-slate-100">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[#5F6F6D] shrink-0">Payment Memo ID:</span>
            <span className="font-mono font-bold text-[#075E54] truncate">{request.memo}</span>
          </div>
          {request.customerName && (
            <div className="flex justify-between items-center gap-2">
              <span className="text-[#5F6F6D] shrink-0">Billed To:</span>
              <span className="font-semibold text-[#102A2A] truncate">{request.customerName}</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-2">
            <span className="text-[#5F6F6D] shrink-0">Payment Network:</span>
            <span className="font-medium text-[#102A2A]">Stellar Testnet</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-[#5F6F6D] shrink-0">Custody:</span>
            <span className="font-bold text-[#075E54]">100% Non-Custodial Direct</span>
          </div>
        </div>

        {/* Status / Error feedback */}
        {statusMessage && (
          <div className="mt-4 sm:mt-5 rounded-2xl border border-[#075E54]/20 bg-[#075E54]/5 p-3.5 flex items-center gap-2.5 text-xs text-[#075E54]">
            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-[#075E54]" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 sm:mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Testnet Faucet Quick Action */}
        {isAuthenticated && user?.address && (
          <div className="mt-4 rounded-2xl border border-[#F2A900]/30 bg-[#F2A900]/10 p-3.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="font-bold text-[#102A2A] block">Testing on Stellar Testnet?</span>
                <span className="text-[11px] sm:text-2xs text-[#5F6F6D]">Get 10,000 free testnet XLM for this wallet</span>
              </div>
              <button
                type="button"
                onClick={handleFundFriendbot}
                disabled={funding}
                className="w-full sm:w-auto shrink-0 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#F2A900]/40 bg-white px-3.5 py-2 text-xs font-bold text-[#b37d00] shadow-2xs hover:bg-white/80 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {funding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Funding...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-[#F2A900]" />
                    <span>Get 10,000 XLM</span>
                  </>
                )}
              </button>
            </div>
            {fundingMessage && (
              <div className="mt-2.5 rounded-xl bg-white p-2.5 text-2xs font-semibold text-[#102A2A] border border-[#F2A900]/30">
                {fundingMessage}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 sm:mt-6 space-y-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#075E54] px-5 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white shadow-lg shadow-[#075E54]/25 hover:bg-[#064e46] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {paying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5 text-[#F2A900]" />
                  <span>
                    Pay {formatAmount(request.amount)} {request.currency} with Pollar
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              disabled={isAuthLoading}
              className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#075E54] px-5 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white shadow-lg shadow-[#075E54]/25 hover:bg-[#064e46] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Wallet className="h-5 w-5 text-[#F2A900]" />
              <span>Connect Pollar Wallet to Pay</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-2xs text-[#5F6F6D] pt-1 text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-[#075E54] shrink-0" />
            <span>Non-custodial settlement confirmed on Stellar Horizon</span>
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
        <div className="flex flex-1 items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
        </div>
      }
    >
      <PaymentCheckoutContent requestId={requestId} />
    </Suspense>
  );
}
